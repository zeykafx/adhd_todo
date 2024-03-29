<script lang="ts">
	import { onMount } from "svelte";
	import { Block, BlockTitle, Button, List, ListInput } from "konsta/svelte";
	import toast from "svelte-french-toast";
	import authStore from "$lib/firebase/firebase";
	import todosStore, { addTodo } from "./todosStore";
	import { getWorkerUrl } from "$lib";

	export let parentId: number | null;

	let workerUrl = getWorkerUrl();
	// state
	let content = "";

	async function addToDb() {
		if (content.trim() === "") {
			toast.error("Enter a todo");
			return;
		}

		if (!$authStore.isLoggedIn) {
			toast.error("You must be logged in to add a todo");
			return;
		}

		let user_id = $authStore.user?.uid!;
		let userToken = await $authStore.user?.getIdToken();

		let done = false;
		let created_at = new Date().getTime().toString();
		let order = $todosStore.todos.length + 1;

		let is_subtask = $todosStore.addingSubtask;
		let parent_id = $todosStore.addingSubtaskParentId;

		fetch(workerUrl + "/todos/add", {
			method: "POST",
			body: JSON.stringify({
				order: order,
				content: content,
				done: done,
				created_at: created_at,
				user_id: user_id,
				is_subtask: is_subtask,
				parent_id: parent_id,
			}),
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + userToken,
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
						is_subtask: element.is_subtask,
						has_subtasks: element.has_subtasks,
						parent_id: element.parent_id,
						has_been_broken_down: element.has_been_broken_down,
					});
				}

				// update the 'has_subtasks' property of the parent todo
				if (parent_id !== null) {
					let parentTodo = $todosStore.todos.find(
						(t) => t.id === parent_id,
					);
					if (parentTodo !== undefined) {
						parentTodo.has_subtasks = true;
					}
				}

				// reset the input field value
				content = "";
				$todosStore.addingSubtask = false;
				$todosStore.addingSubtaskParentId = null;
			});
	}

	onMount(() => {
		// add event listener for enter key
		document
			.getElementById("input_field")
			?.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					addToDb();
				}
			});

		document
			.getElementById("sub_input_field")
			?.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					addToDb();
				}
			});
	});
</script>

<!-- should compose this -->
{#if $todosStore.addingSubtask && parentId !== null}
	<div class="flex flex-row gap-2 items-center justify-center">
		<ListInput
			id="sub_input_field"
			class="w-full"
			outline
			type="text"
			placeholder="Subtask"
			value={content}
			onInput={(e) => (content = e.target.value)}
		/>
		<Button rounded onClick={addToDb} class="w-min mx-auto mt-2">
			Add
		</Button>

		<Button
			rounded
			onClick={() => {
				$todosStore.addingSubtask = false;
				$todosStore.addingSubtaskParentId = null;
			}}
			class="w-min mx-auto mt-2 mr-4"
		>
			Cancel
		</Button>
	</div>
{:else}
	<Block>
		<BlockTitle>New Todo</BlockTitle>

		<List>
			<div class="flex flex-row gap-2 items-center justify-center">
				<ListInput
					id="input_field"
					class="w-full"
					outline
					label="Todo"
					type="text"
					placeholder="Todo"
					floatingLabel
					value={content}
					onInput={(e) => (content = e.target.value)}
				/>
				<Button rounded onClick={addToDb} class="w-min mx-auto mt-2">
					Add
				</Button>
			</div>
		</List>
	</Block>
{/if}
