import {createClient} from '@libsql/client/http';

export function tursoClient() {
    const url = import.meta.env.VITE_TURSO_DB_URL?.trim();
    if (url === undefined) {
        throw new Error('VITE_TURSO_DB_URL is not defined');
    }

    const authToken = import.meta.env.VITE_TURSO_DB_AUTH_TOKEN?.trim();
    if (authToken === undefined && !url.startsWith('file:')) {
        new Error('VITE_TURSO_DB_AUTH_TOKEN is not defined');
    }

    return createClient({
        url,
        authToken
    });
}