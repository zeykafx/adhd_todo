import {Router, RouterType} from 'itty-router';
import {addTodo, deleteTodo, editOrder, editTodo, getTodos} from "./todos/todos";

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

	router.get('/todos/get', () => getTodos(headers, env));

	router.post('/todos/add', (request) => addTodo(headers, env, request));

	router.put('/todos/edit',  (request) => editTodo(headers, env, request));
	router.put('/todos/editOrder', (request) => editOrder(headers, env, request));

	router.delete('/todos/delete', (request) => deleteTodo(headers, env, request));



	router.all('*', () => new Response('Not Found.', {status: 404}));

	return router;
}
