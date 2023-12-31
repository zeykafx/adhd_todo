// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {
		// 	env: {
		// 		LIBSQL_DB_URL: "libsql://perfect-grandmaster-zeykafx.turso.io"
		// 		LIBSQL_DB_AUTH_TOKEN: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIyMDIzLTExLTA0VDExOjA2OjI0LjE4OTI2ODU5OVoiLCJpZCI6IjcyMWZmNDgwLTdiMDEtMTFlZS04ZWNlLWFlODAyMjk2YjVlMSJ9._HaBaEVKb0gCZ1DA35dmxm2NXUnaAUI-8Iv6s5MJp1RoWktmd6IQ0VKaSJKId-WALxMk50w3VhkV4Q_UE1IjCw"
		// 	}
		// }
	}

	declare type Item = import("svelte-dnd-action").Item;
	declare type DndEvent<ItemType = Item> =
		import("svelte-dnd-action").DndEvent<ItemType>;
	declare namespace svelteHTML {
		interface HTMLAttributes<T> {
			"on:consider"?: (
				event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T }
			) => void;
			"on:finalize"?: (
				event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T }
			) => void;
		}
	}

	declare interface Window {
		setMode: (string) => void,
		theme: "dark" | "light",
	}
}

export {};
