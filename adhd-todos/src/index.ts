import {Client as LibsqlClient, createClient} from '@libsql/client/web';
import {Router, RouterType} from 'itty-router';
import {type LibSQLDatabase, drizzle} from 'drizzle-orm/libsql';
import {example, todos} from '../drizzle/schema';
import {eq} from 'drizzle-orm';

export interface Env {
	// The environment variable containing the URL for your Turso database.
	LIBSQL_DB_URL?: string;
	// The Secret that contains the authentication token for your Turso database.
	LIBSQL_DB_AUTH_TOKEN?: string;

	// These objects are created before first use, then stashed here
	// for future use
	router?: RouterType;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (env.router === undefined) {
			env.router = buildRouter(env);
		}

		return env.router.handle(request);
	},
};

function buildLibsqlClient(env: Env): LibSQLDatabase {
	const url = env.LIBSQL_DB_URL?.trim();
	if (url === undefined) {
		throw new Error('LIBSQL_DB_URL env var is not defined');
	}

	const authToken = env.LIBSQL_DB_AUTH_TOKEN?.trim();
	if (authToken === undefined) {
		throw new Error('LIBSQL_DB_AUTH_TOKEN env var is not defined');
	}

	return drizzle(createClient({url, authToken}));
}

function buildRouter(env: Env): RouterType {
	let headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Credentials': 'true',
		'Access-Control-Allow-Origin': '*',
	};

	const router = Router();

	router.options(
		'*',
		() =>
			new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Credentials': 'true',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			})
	);

	router.get('/todos/get', async () => {
		const client = buildLibsqlClient(env);
		const rs = await client.select().from(todos).all();
		return Response.json(rs, {headers});
	});

	router.post('/todos/add', async (request) => {
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
	});

	router.put('/todos/edit', async (request) => {
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
	});

	router.delete('/todos/delete', async (request) => {
		const client = buildLibsqlClient(env);
		const body = (await request.json()) as { id: number };

		let res = await client.delete(todos).where(eq(todos.id, body.id)).returning();

		return Response.json(res, {headers});
	});


	router.all('*', () => new Response('Not Found.', {status: 404}));

	return router;
}
