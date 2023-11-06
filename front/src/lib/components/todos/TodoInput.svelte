<script lang="ts">
	import { onMount } from "svelte";
	import { Block, BlockTitle, Button, List, ListInput } from "konsta/svelte";
	import toast from "svelte-french-toast";
	import authStore from "$lib/firebase/firebase";

	interface Todo {
		id: number;
		order: number;
		content: string;
		created_at: Date;
		updated_at: Date;
		done: boolean;
		user_id: number;
	}

	export let todos: Todo[];
	export let workerUrl: string;
	export let addTodo: (todo: {
		id: number;
		order: number;
		content: string;
		created_at: string;
		updated_at: string;
		done: boolean;
		user_id: number;
	}) => void;

	// state
	let content = "";

	function addToDb() {
		if (content.trim() === "") {
			toast.error("Enter a todo");
			return;
		}

		if (!$authStore.isLoggedIn) {
			toast.error("You must be logged in to add a todo");
			return;
		}

		let user_id = $authStore.user?.uid!;
				let userToken = $authStore.user?.getIdToken();

		let done = false;
		let created_at = new Date().getTime().toString();
		let order = todos.length + 1;

		fetch(workerUrl + "/todos/add", {
			method: "POST",
			body: JSON.stringify({
				order: order,
				content: content,
				done: done,
				created_at: created_at,
				user_id: user_id,
			}),
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer " + userToken,
			},
		})
			.then((res) => res.json())
			.then((res) => {
				toast.success("Added Todo");

				for (let element of res) {
					addTodo({
						id: element.id,
						order: element.order,
						content: element.content,
						created_at: element.created_at,
						updated_at: element.updated_at,
						done: element.done,
						user_id: element.user_id,
					});
				}

				// reset the input field value
				content = "";
			});
	}

	onMount(() => {
		// add event listener for enter key
		document.getElementById("input_field")?.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				addToDb();
			}
		});
	});
</script>

<Block>
	<BlockTitle>New Todo</BlockTitle>

	<List>
		<div class="flex flex-row gap-2 items-center justify-center">
			<ListInput
				id="input_field"
				class="w-full"
				outline
				label="Content"
				type="text"
				placeholder="Content"
				floatingLabel
				value={content}
				onInput={(e) => (content = e.target.value)}
			/>
			<Button rounded onClick={addToDb} class="w-min mx-auto mt-2">Add</Button>
		</div>
	</List>
</Block>
