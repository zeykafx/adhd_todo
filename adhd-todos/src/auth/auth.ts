import { Env } from '../index';
let { verifyIdToken } = require('web-auth-library/google');
// import {verifyIdToken, UserToken} from 'web-auth-library/dist/google';

export async function authMiddleware(headers: Record<string, string>, env: Env, request: Request) {
	let localReq = request.clone();

	let body: any = await localReq.json();
	let user_id = body.user_id;

	if (user_id === undefined) {
		return Response.json({ error: 'user_id is undefined' }, { headers });
	}

	let token;
	try {
		token = await verifyHeaderToken(env, request, headers);
	} catch (e) {
		console.log('Error verifying token');

		console.log(e);
		return Response.json({ error: 'Invalid token' }, { headers });
	}

	// check that the user_id in the token matches the user_id in the request
	let isCorrectUser = verifyTokenAndUid(user_id, token);
	if (!isCorrectUser) {
		return new Response('Invalid user_id', { status: 401 });
	}
}

/*
 * Verify and return the token in the Authorization header
 */
async function verifyHeaderToken(env: Env, request: Request, headers: Record<string, string>) {
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
		waitUntil: () => new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 60)),
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
