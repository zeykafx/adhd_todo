import OpenAI from 'openai';
import { Env } from '..';
import buildLibsqlClient from '../db';
import { todos } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export function createOpenaiAPI(env: Env) {
	return new OpenAI({
		apiKey: env.OPENAI_API_KEY?.trim(),
	});
}

let prompt =
	"Given a user submitted task, break it down into a list of subtasks that can be completed sequentially to achieve the overall goal, answer with 1 to 6 subtasks depending on the context. Output the subtasks in a json format with the key 'subtasks' that contains a list of the subtasks.";

export async function breakdownSubtasks(request: Request, headers: Record<string, string>, env: Env, openai: OpenAI) {
	const client = buildLibsqlClient(env);

	const { user_id, message, todo_id } = (await request.json()) as { user_id: string; message: string; todo_id: number };

	// check in the database that the user_id is valid

	// check if the todo has already been broken down
	const rs = await client.select().from(todos).where(eq(todos.id, todo_id));
	if (rs[0].has_been_broken_down) {
		return new Response('Todo has already been broken down', { status: 401, headers });
	}

	// get the subtasks from gpt3
	const chatCompletion = await openai.chat.completions.create({
		messages: [
			{
				role: 'system',
				content: prompt,
			},
			{
				role: 'user',
				content: message,
			},
		],
		model: 'gpt-3.5-turbo-1106',
		response_format: { type: 'json_object' },
		stream: false,
	});

	// parse the subtasks from the response
	let subtasks = chatCompletion.choices[0].message.content;
	if (subtasks === undefined) {
		return new Response('Failed to parse subtasks', { status: 401, headers });
	}

	let subtasksJson = JSON.parse(subtasks!);

	// update the parent todo to indicate that it has been broken down
	await client
		.update(todos)
		.set({ has_been_broken_down: true })
		.where(eq(todos.id, todo_id))
		.execute();

	let created_at = new Date().getTime().toString();

	// insert the subtasks into the database
	let retArr = [];
	for (let subtask of subtasksJson.subtasks) {
		let res = await client
			.insert(todos)
			.values({
				order: 0, // the order doesn't matter for subtasks
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

	return Response.json(retArr, { headers });
}
