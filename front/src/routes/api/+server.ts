import type { RequestHandler } from './$types';
import {tursoClient} from "$lib/server/turso";

export const GET = (async ({url, platform}) => {
    const db = tursoClient();

    let res = await db.execute("SELECT * FROM example")
    // console.log(res)

    return new Response(JSON.stringify(res.rows), { headers: { 'content-type': 'application/json' } });
}) satisfies RequestHandler;