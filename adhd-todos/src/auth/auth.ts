import { users } from '../../drizzle/schema';
import buildLibsqlClient from '../db';
import { Env } from '../index';
let { verifyIdToken } = require('web-auth-library/google');
// import {verifyIdToken, UserToken} from 'web-auth-library/dist/google';

export async function authMiddleware(headers: Record<string, string>, env: Env, request: Request) {
	let localReq = request.clone(); // clone the request so we can use it twice

	let body: any = await localReq.json();
	let user_id = body.user_id;

	if (user_id === undefined) {
		return new Response('user_id is not defined', { status: 401, headers });
	}

	let token;
	try {
		token = await verifyHeaderToken(env, localReq);
	} catch (e: any) {
		console.log('Error verifying token');

		console.log(e)
		return Response.json({error: 'Error verifying token'}, { status: 401, headers });
	}

	// check that the user_id in the token matches the user_id in the request
	let isCorrectUser = verifyTokenAndUid(user_id, token);
	if (!isCorrectUser) {
		return new Response('Invalid user_id', { status: 401, headers });
	}
}

/*
 * handles the create new user request
 */
export async function createNewUser(headers: Record<string, string>, env: Env, request: Request) {
	const client = buildLibsqlClient(env);

	const { id, displayName, email } = (await request.json()) as { id: string, email: string, displayName: string };

	await client
		.insert(users)
		.values({
			id: id,
			username: displayName,
			email: email,
			has_limit: true,
			last_time_broke_down: '',
			number_of_breakdowns_today: 0,
		});

	return new Response("OK", { status: 200, headers: headers });
}

/*
 * Verify and return the token in the Authorization header
 */
async function verifyHeaderToken(env: Env, request: Request) {
	// parse the user token from the headers
	let authorizationHeader = request.headers.get('Authorization');

	if (authorizationHeader === null) {
		throw new Error('Authorization header is undefined');
	}

	let idToken = authorizationHeader.split(' ')[1];

	let token;

	token = await verifyIdToken({
		idToken,
		env: env,
		waitUntil: () => new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 60 * 24 * 365 * 10)),
	});

	return token;
}

/*
 * Verify that the user_id in the token matches the user_id in the request
 */
function verifyTokenAndUid(user_id: string, token: any): boolean {
	if (user_id !== token.user_id) {
		return false;
	}

	return true;
}
