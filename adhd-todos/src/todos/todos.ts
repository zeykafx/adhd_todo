import buildLibsqlClient from '../db';
import { todos } from '../../drizzle/schema';
import { Env } from '../index';
import { eq, sql } from 'drizzle-orm';

interface Todo {
	id: number;
	order: number;
	content: string;
	created_at: Date;
	updated_at: Date;
	done: boolean;
	user_id: number;
	is_subtask: boolean;
	has_subtasks: boolean;
	subtasks_hidden: boolean; // not in db because it doesn't matter
	parent_id: number | null;
	has_been_broken_down: boolean;
}

/*
 * Get all todos for a user
 */
export async function getTodos(headers: Record<string, string>, env: Env, request: Request) {
	const client = buildLibsqlClient(env);

	let { user_id } = (await request.json()) as { user_id: string };

	const rs = await client.select().from(todos).where(eq(todos.user_id, user_id)).orderBy(todos.order);

	return Response.json(rs, { headers });
}

/*
 * Add a todo in the database for a user
 */
export async function addTodo(headers: Record<string, string>, env: Env, request: Request) {
	const client = buildLibsqlClient(env);

	const { order, content, done, created_at, user_id, is_subtask, parent_id } = (await request.json()) as {
		order: number;
		content: string;
		done: boolean;
		created_at: string;
		user_id: string;
		is_subtask: boolean;
		parent_id: number | null;
	};

	if (parent_id !== null) {
		// set the parent "has_subtasks" flag to true
		let res = await client
			.update(todos)
			.set({
				has_subtasks: true,
			})
			.where(sql`${todos.id} = ${parent_id} and ${todos.user_id} = ${user_id}`)
			.returning();
	}

	let res = await client
		.insert(todos)
		.values({
			order: order,
			content: content,
			done: done,
			created_at: created_at,
			updated_at: created_at,
			user_id: user_id,
			is_subtask: is_subtask,
			parent_id: parent_id,
		})
		.returning();

	return Response.json(res, { headers });
}

/*
 * Delete one to do for a user
 */
export async function deleteTodo(headers: Record<string, string>, env: Env, request: Request) {
	const client = buildLibsqlClient(env);
	const { id, user_id } = (await request.json()) as { id: number; user_id: string };

	// if we deleted the last subtask, set the parent "has_subtasks" flag to false
	let todo = await client
		.select()
		.from(todos)
		.where(sql`${todos.id} = ${id}`);
	if (todo[0].parent_id !== null) {
		let subtasks = await client
			.select()
			.from(todos)
			.where(sql`${todos.parent_id} = ${todo[0].parent_id}`);
		if (subtasks.length === 1) {
			await client
				.update(todos)
				.set({
					has_subtasks: false,
				})
				.where(sql`${todos.id} = ${todo[0].parent_id} and ${todos.user_id} = ${user_id}`);
		}
	}

	let retArr: any = [];
	let res = await client
		.delete(todos)
		.where(sql`${todos.id} = ${id} and ${todos.user_id} = ${user_id}`)
		.returning();

	retArr.push(res[0]);

	// check if the to do had subtasks
	let subtasks = await client
		.select()
		.from(todos)
		.where(sql`${todos.parent_id} = ${id}`);
	if (subtasks.length > 0) {
		// delete all the subtasks
		let locRes = await client
			.delete(todos)
			.where(sql`${todos.parent_id} = ${id}`)
			.returning();
		locRes.forEach((r) => retArr.push(r));
	}

	return Response.json(retArr, { headers });
}

/*
 * Edit the to do's contents for a user
 */
export async function editTodo(headers: Record<string, string>, env: Env, request: Request) {
	const client = buildLibsqlClient(env);

	const { id, order, content, done, updated_at, user_id } = (await request.json()) as {
		id: number;
		order: number;
		content: string;
		done: boolean;
		updated_at: string;
		user_id: string;
	};

	let retArr: any = [];
	let res = await client
		.update(todos)
		.set({
			order: order,
			content: content,
			done: done,
			updated_at: updated_at,
		})
		.where(sql`${todos.id} = ${id} and ${todos.user_id} = ${user_id}`)
		.returning();

	retArr.push(res[0]);

	// if the to do is done, check if it has subtasks, and if so, mark them as done
	if (done) {
		let subtasks = await client
			.select()
			.from(todos)
			.where(sql`${todos.parent_id} = ${id}`);
			
		if (subtasks.length > 0) {
			let locRes = await client
				.update(todos)
				.set({
					done: true,
					updated_at: updated_at,
				})
				.where(sql`${todos.parent_id} = ${id}`)
				.returning();

			locRes.forEach((r) => retArr.push(r));
		}
	}

	return Response.json(retArr, { headers });
}

/*
 * Edit the order of all the user's todos
 */
export async function editOrder(headers: Record<string, string>, env: Env, request: Request) {
	const client = buildLibsqlClient(env);

	// we get the user's todos in the body
	const { reqTodos, user_id } = (await request.json()) as {
		reqTodos: Todo[];
		user_id: string;
	};

	let retArr: any = [];

	// we update the order of each todo in the database
	await client.transaction(async (tx) => {
		for (let i = 0; i < reqTodos.length; i++) {
			let todo = reqTodos[i];

			let res = await tx
				.update(todos)
				.set({
					order: i,
				})
				.where(sql`${todos.id} = ${todo.id} and ${todos.user_id} = ${user_id}`)
				.returning();

			retArr.push(res[0]);
		}
	});

	return Response.json(retArr, { headers });
}

export async function clearSubtasks(headers: Record<string, string>, env: Env, request: Request) {
	const client = buildLibsqlClient(env);

	// we get the user's todo in the body
	const { todo, user_id } = (await request.json()) as {
		todo: Todo;
		user_id: string;
	};

	// we remove all the subtasks from the database for that todo in the DB
	let res = await client
		.delete(todos)
		.where(sql`${todos.parent_id} = ${todo.id} and ${todos.user_id} = ${user_id}`)
		.returning();

	return Response.json(res, { headers });
}
