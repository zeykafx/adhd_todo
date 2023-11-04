// return the cloudflare worker url depending on the environment
export function getWorkerUrl() {
    const url = process.env.NODE_ENV === "production" ?
        "https://adhd-todos.corentin-detry.workers.dev" :
        "http://0.0.0.0:8787";
    return url;
}