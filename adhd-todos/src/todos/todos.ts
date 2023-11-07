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
}

export async function getTodos(headers: Record<string, string>, env: Env, request: Request) {
	const client = buildLibsqlClient(env);

	let { user_id } = (await request.json()) as { user_id: string };

	const rs = await client.select().from(todos).where(eq(todos.user_id, user_id)).orderBy(todos.order);

	return Response.json(rs, { headers });
}

export async function addTodo(headers: Record<string, string>, env: Env, request: Request) {
	const client = buildLibsqlClient(env);

	const { order, content, done, created_at, user_id } = (await request.json()) as {
		order: number;
		content: string;
		done: boolean;
		created_at: string;
		user_id: string;
	};

	let res = await client
		.insert(todos)
		.values({
			order: order,
			content: content,
			done: done,
			created_at: created_at,
			updated_at: created_at,
			user_id: user_id,
		})
		.returning();

	return Response.json(res, { headers });
}

export async function deleteTodo(headers: Record<string, string>, env: Env, request: Request) {
	const client = buildLibsqlClient(env);
	const { id, user_id } = (await request.json()) as { id: number; user_id: string };

	let res = await client
		.delete(todos)
		.where(sql`${todos.id} = ${id} and ${todos.user_id} = ${user_id}`)
		.returning();

	return Response.json(res, { headers });
}

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
	return Response.json(res, { headers });
}

export async function editOrder(headers: Record<string, string>, env: Env, request: Request) {
	const client = buildLibsqlClient(env);

	const { reqTodos, user_id } = (await request.json()) as {
		reqTodos: Todo[];
		user_id: string;
	};

	let retArr: any = [];

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
