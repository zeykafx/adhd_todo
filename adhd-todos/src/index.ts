import { Router, RouterType } from 'itty-router';
import { authMiddleware, createNewUser } from './auth/auth';
import { addTodo, deleteTodo, editOrder, editTodo, getTodos } from './todos/todos';
import { breakdownSubtasks, createOpenaiAPI } from './ai/ai';

export interface Env {
	// The environment variable containing the URL for your Turso database.
	LIBSQL_DB_URL?: string;
	// The Secret that contains the authentication token for your Turso database.
	LIBSQL_DB_AUTH_TOKEN?: string;
	GOOGLE_CLOUD_CREDENTIALS?: string;
	OPENAI_API_KEY?: string;

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

function buildRouter(env: Env): RouterType {
	if (env.GOOGLE_CLOUD_CREDENTIALS === undefined) {
		throw new Error('GOOGLE_CLOUD_CREDENTIALS is not defined.');
	}

	let headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Credentials': 'true',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};

	const router = Router();
	let openai = createOpenaiAPI(env);

	router.options(
		'*',
		() =>
			new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Credentials': 'true',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			})
	);

	// To-dos routes
	router.all('/todos/*', (request) => authMiddleware(headers, env, request)); // auth middleware
	router.post('/todos/get', (request) => getTodos(headers, env, request));
	router.post('/todos/add', (request) => addTodo(headers, env, request));
	router.put('/todos/edit', (request) => editTodo(headers, env, request));
	router.put('/todos/editOrder', (request) => editOrder(headers, env, request));
	router.delete('/todos/delete', (request) => deleteTodo(headers, env, request));

	// AI routes
	router.all('/ai/*', (request) => authMiddleware(headers, env, request)); // auth middleware
	router.post("/ai/breakdown", (req) => breakdownSubtasks(req, headers, env, openai))

	// Users routes
	router.post("/auth/create", (req) => createNewUser(headers, env, req));

	router.all('*', () => new Response('Not Found.', { status: 404 }));

	return router;
}
