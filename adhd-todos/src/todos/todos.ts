import buildLibsqlClient from "../db";
import {example, todos} from "../../drizzle/schema";
import {Env} from "../index";
import {eq} from "drizzle-orm";

interface Todo {
	id: number;
	order: number;
	content: string;
	created_at: Date;
	updated_at: Date;
	done: boolean;
	user_id: number;
}

export async function getTodos(headers: Record<string, string>, env: Env) {
	const client = buildLibsqlClient(env);
	const rs = await client.select().from(todos).all();
	return Response.json(rs, {headers});
}

export async function addTodo(
	headers: Record<string, string>,
	env: Env,
	request: Request
) {
	const client = buildLibsqlClient(env);

	const {order, content, done, created_at, user_id} = (await request.json()) as {
		order: number;
		content: string;
		done: boolean;
		created_at: string;
		user_id: number;
	};

	let res = await client
		.insert(todos)
		.values({
			order: order,
			content: content,
			done: done,
			created_at: created_at,
			updated_at: created_at,
			user_id: user_id
		})
		.returning();

	return Response.json(res, {headers});
}

export async function deleteTodo(headers: Record<string, string>, env: Env, request: Request) {
	const client = buildLibsqlClient(env);
	const body = (await request.json()) as { id: number };

	let res = await client.delete(todos).where(eq(todos.id, body.id)).returning();

	return Response.json(res, {headers});
}

export async function editTodo(
	headers: Record<string, string>,
	env: Env,
	request: Request
) {
	const client = buildLibsqlClient(env);

	const {id, order, content, done, updated_at} = (await request.json()) as {
		id: number;
		order: number,
		content: string;
		done: boolean;
		updated_at: string
	};

	let res = await client.update(todos).set({
		order: order,
		content: content,
		done: done,
		updated_at: updated_at
	}).where(eq(todos.id, id)).returning();
	return Response.json(res, {headers});
}

export async function editOrder(
	headers: Record<string, string>,
	env: Env,
	request: Request
) {
	const client = buildLibsqlClient(env);

	const {reqTodos} = (await request.json()) as {
		reqTodos: Todo[]
	};

	let retArr = [];

	for (let i = 0; i < reqTodos.length; i++) {
		let todo = reqTodos[i];
		let res = await client.update(todos).set({
			order: i,
		}).where(eq(todos.id, todo.id)).returning();

		retArr.push(res[0]);
	}

	return Response.json(retArr, {headers});
}
