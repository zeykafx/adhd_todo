import OpenAI from 'openai';
import { Env } from '..';
import buildLibsqlClient from '../db';
import { todos, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export function createOpenaiAPI(env: Env) {
	return new OpenAI({
		apiKey: env.OPENAI_API_KEY?.trim(),
	});
}

let PROMPT =
	"Given a user submitted task, break it down into a list of subtasks that can be completed sequentially to achieve the overall goal, answer with 1 to 6 subtasks depending on the context. Output the subtasks in a json format with the key 'subtasks' that contains a list of the subtasks.";
let BREAKDOWN_LIMIT = 20;

export async function breakdownSubtasks(request: Request, headers: Record<string, string>, env: Env, openai: OpenAI) {
	const client = buildLibsqlClient(env);

	const { user_id, message, todo_id } = (await request.json()) as { user_id: string; message: string; todo_id: number };

	// fetch the user from the database
	const rsUser = await client.select().from(users).where(eq(users.id, user_id));
	if (rsUser.length === 0) {
		return new Response('User not found', { status: 401, headers });
	}

	// get the number of breakdowns the user has done today
	let breakdownsToday = rsUser[0]?.number_of_breakdowns_today!;

	// now compared to the last time they broke down a task
	let compare = new Date().getTime() - parseInt(rsUser[0]?.last_time_broke_down!);

	// if it has been more than 24 hours, reset the number of breakdowns today
	if (compare >= 86400000) {
		breakdownsToday = 0;

		let date = new Date();
		await client
			.update(users)
			.set({ number_of_breakdowns_today: breakdownsToday, last_time_broke_down: date.getTime().toString() })
			.where(eq(users.id, user_id))
			.execute();
	}

	// if the user has reached their breakdown limit, return an error
	if (breakdownsToday >= BREAKDOWN_LIMIT && rsUser[0]?.has_limit! && compare < 86400000) {
		return Response.json({ error: 'Out of AI uses today' }, { status: 401, headers });
	}

	// check if the todo has already been broken down
	const rs = await client.select().from(todos).where(eq(todos.id, todo_id));
	if (rs[0].has_been_broken_down) {
		return Response.json({ error: 'Todo has already been broken down' }, { status: 401, headers });
	}

	// get the subtasks from gpt3
	const chatCompletion = await openai.chat.completions.create({
		messages: [
			{
				role: 'system',
				content: PROMPT,
			},
			{
				role: 'user',
				content: message,
			},
		],
		model: 'gpt-4o-mini',
		response_format: { type: 'json_object' },
		stream: false,
	});

	// parse the subtasks from the response
	let subtasks = chatCompletion.choices[0].message.content;
	if (subtasks === undefined) {
		return Response.json({ error: 'Failed to parse subtasks' }, { status: 401, headers });
	}

	let subtasksJson = JSON.parse(subtasks!);

	// update the parent todo to indicate that it has been broken down
	await client.update(todos).set({ has_been_broken_down: true }).where(eq(todos.id, todo_id)).execute();

	let created_at = new Date().getTime().toString();

	// insert the subtasks into the database
	let retArr = [];
	for (let i = 0; i < subtasksJson.subtasks.length; i++) {
		let subtask = subtasksJson.subtasks[i];
		let res = await client
			.insert(todos)
			.values({
				order: i + 1,
				content: subtask,
				done: false,
				created_at: created_at,
				updated_at: created_at,
				user_id: user_id,
				is_subtask: true,
				parent_id: todo_id,
				has_been_broken_down: false,
			})
			.returning();

		retArr.push(res[0]);
	}

	// update the user's number of breakdowns today
	await client
		.update(users)
		.set({ number_of_breakdowns_today: breakdownsToday + 1, last_time_broke_down: created_at })
		.where(eq(users.id, user_id))
		.execute();

	return Response.json(retArr, { headers });
}
