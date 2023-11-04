import {createClient} from '@libsql/client/http';
import { VITE_TURSO_DB_URL, VITE_TURSO_DB_AUTH_TOKEN } from '$env/static/private';

export function tursoClient() {
    const url = VITE_TURSO_DB_URL?.trim();
    if (url === undefined) {
        throw new Error('VITE_TURSO_DB_URL is not defined');
    }

    const authToken = VITE_TURSO_DB_AUTH_TOKEN?.trim();
    if (authToken === undefined && !url.startsWith('file:')) {
        new Error('VITE_TURSO_DB_AUTH_TOKEN is not defined');
    }

    return createClient({
        url,
        authToken
    });
}