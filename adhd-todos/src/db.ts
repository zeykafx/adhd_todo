import {drizzle, type LibSQLDatabase} from "drizzle-orm/libsql";
import {Env} from "./index";
import {createClient} from '@libsql/client/web';

export default function buildLibsqlClient(env: Env): LibSQLDatabase {
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
