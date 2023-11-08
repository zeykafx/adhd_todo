<script lang="ts">
	import toast from "svelte-french-toast";
	import {
		Block,
		Button,
		List,
		BlockTitle,
		ListItem,
		Checkbox,
		Dialog,
		DialogButton,
		Popover,
		Preloader,
	} from "konsta/svelte";
	import { onMount } from "svelte";
	import { getWorkerUrl } from "$lib";
	import dayjs from "dayjs";
	import relativeTime from "dayjs/plugin/relativeTime";
	import { flip } from "svelte/animate";
	import { dndzone, type DndEvent } from "svelte-dnd-action";
	import TodoInput from "$lib/components/todos/TodoInput.svelte";
	import clsx from "clsx";
	import authStore from "$lib/firebase/firebase";
	import todosStore, { type Todo, addTodo } from "./todosStore";
	import TodoComponent from "./TodoComponent.svelte";

	dayjs.extend(relativeTime);
	let workerUrl = getWorkerUrl();

	// delete and edit todo state
	let deleteAlertOpen = false;
	let todoToDelete: Todo | null = null;
	let editingTodo: Todo | null = null;

	// popover state
	let popoverOpened = false;
	let popoverTargetEl: string | HTMLElement | null = null;

	const openPopover = (targetEl: string | HTMLElement) => {
		popoverTargetEl = targetEl;
		popoverOpened = true;
	};

	async function fetchDbContents() {
		if ($todosStore.fetchedOnce) return;

		$todosStore.loading = true;

		let userToken = await $authStore.user?.getIdToken();

		fetch(workerUrl + "/todos/get", {
			method: "POST",
			body: JSON.stringify({ user_id: $authStore.user?.uid! }),
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + userToken,
			},
		})
			.then((res) => res.json())
			.then((res) => {
				$todosStore.todos = [];

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
						parent_id: element.parent_id,
					});
				}

				$todosStore.loading = false;
			});
	}

	async function deleteFromDb(id: number) {
		let userToken = await $authStore.user?.getIdToken();

		fetch(workerUrl + "/todos/delete", {
			method: "DELETE",
			body: JSON.stringify({ id: id, user_id: $authStore.user?.uid! }),
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + userToken,
			},
		})
			.then((res) => res.json())
			.then((res) => {
				toast.success("Deleted Todo");
				for (let element of res) {
					$todosStore.todos = $todosStore.todos.filter(
						(todo) => todo.id !== element.id
					);
				}
			});
	}

	async function editInDb(
		id: number,
		order: number,
		content: string,
		done: boolean
	) {
		let updated_at = new Date().getTime().toString();
		let userToken = await $authStore.user?.getIdToken();

		fetch(workerUrl + "/todos/edit", {
			method: "PUT",
			body: JSON.stringify({
				id: id,
				order: order,
				content: content,
				done: done,
				updated_at: updated_at,
				user_id: $authStore.user?.uid!,
			}),
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + userToken,
			},
		})
			.then((res) => res.json())
			.then((res) => {
				// toast.success("Edited to do");
				for (let rElem of res) {
					$todosStore.todos = $todosStore.todos.map((todo) => {
						if (todo.id === rElem.id) {
							todo.order = rElem.order;
							todo.content = rElem.content;
							todo.done = rElem.done;
						}
						return todo;
					});
				}
			});
	}

	async function editOrder() {
		let userToken = await $authStore.user?.getIdToken();

		fetch(workerUrl + "/todos/editOrder", {
			method: "PUT",
			body: JSON.stringify({
				reqTodos: $todosStore.todos,
				user_id: $authStore.user?.uid!,
			}),
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + userToken,
			},
		})
			.then((res) => res.json())
			.then((res) => {
				// toast.success("Edited to do");

				for (let element of res) {
					$todosStore.todos = $todosStore.todos.map((todo) => {
						if (todo.id === element.id) {
							todo.order = element.order;
						}
						return todo;
					});
				}
			});
	}

	// DND Stuff
	let flipDurationMs = 300;
	let dropTargetStyle = {
		"border-color": "rgb(var(--k-color-md-dark-primary))",
	};

	function handleDndConsider(e: CustomEvent<DndEvent<Todo>>) {
		$todosStore.todos = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<Todo>>) {
		$todosStore.todos = e.detail.items;

		editOrder();
	}

	$: {
		if ($authStore.isLoggedIn) {
			fetchDbContents();
			$todosStore.fetchedOnce = true;
		}
	}

	onMount(() => {
		// refresh the state of the todos every 60 seconds, this doesn't fetch from the db but it just
		// updates the time ago string
		const interval = setInterval(() => {
			console.log("refreshing todos");
			$todosStore.todos = $todosStore.todos;
		}, 60000);

		// set the drop target style based on the theme
		dropTargetStyle = {
			"border-color":
				window.theme === "dark"
					? "rgb(var(--k-color-md-dark-primary))"
					: "rgb(var(--k-color-md-light-primary))",
		};

		return () => clearInterval(interval);
	});
</script>

<div
	class="w-full flex flex-col items-center justify-center max-w-screen-lg mx-auto px-4"
>
	<div class="w-full">
		<TodoInput parentId={null} />

		<Block>
			<BlockTitle>Todo list</BlockTitle>

			<List strong class="rounded-xl">
				<section
					class="w-full h-full overflow-hidden border border-md-light-primary/20 dark:border-md-dark-primary/20 rounded-xl transition-all"
					use:dndzone={{
						items: $todosStore.todos,
						flipDurationMs,
						dropTargetStyle,
					}}
					on:consider={handleDndConsider}
					on:finalize={handleDndFinalize}
				>
					{#each $todosStore.todos as todo (todo.id)}
						<div animate:flip={{ duration: flipDurationMs }}>
							{#if !todo.is_subtask}
								<TodoComponent
									{editingTodo}
									{todo}
									{openPopover}
									{editInDb}
								/>
							{/if}
						</div>
					{:else}
						{#if $todosStore.loading || !$authStore.isLoggedIn}
							<div
								class="flex flex-col items-center justify-center p-10"
							>
								<Preloader />
								<ListItem title="Loading..." />
							</div>
						{:else}
							<ListItem title="Nothing to do!" />
						{/if}
					{/each}
				</section>
			</List>
		</Block>
	</div>
</div>

<Dialog
	opened={deleteAlertOpen}
	onBackdropClick={() => (deleteAlertOpen = false)}
>
	<svelte:fragment slot="title">Delete Todo</svelte:fragment>

	Are you sure you want to delete this todo?

	<svelte:fragment slot="buttons">
		<DialogButton onClick={() => (deleteAlertOpen = false)}>
			Cancel
		</DialogButton>
		<DialogButton
			strong
			onClick={() => {
				if (todoToDelete === null) return;

				deleteFromDb(todoToDelete.id);
				return (deleteAlertOpen = false);
			}}
		>
			Confirm
		</DialogButton>
	</svelte:fragment>
</Dialog>

<Popover
	opened={popoverOpened}
	target={popoverTargetEl}
	onBackdropClick={() => (popoverOpened = false)}
>
	<List nested class="p-3">
		<!-- ADD SUBTASK BUTTON -->
		<ListItem
			title="Add subtask"
			link
			chevron={false}
			onClick={() => {
				if (typeof popoverTargetEl === "string") {
					let todoId = parseInt(
						popoverTargetEl.replace(".todo_", "")
					);
					let todo = $todosStore.todos.find(
						(todo) => todo.id === todoId
					);

					if (todo?.is_subtask) {
						toast.error("Can't add subtask to subtask");
						return (popoverOpened = false);
					}

					$todosStore.addingSubtask = true;
					$todosStore.addingSubtaskParentId = todoId;
				}
				return (popoverOpened = false);
			}}
		>
			<div slot="after">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-plus-circle"
				>
					<circle cx="12" cy="12" r="10" />
					<path d="M8 12h8" />
					<path d="M12 8v8" />
				</svg>
			</div>
		</ListItem>

		<!-- EDIT TODO BUTTON -->
		<ListItem
			title="Edit Todo"
			link
			chevron={false}
			onClick={() => {
				if (typeof popoverTargetEl === "string") {
					let todoId = parseInt(
						popoverTargetEl.replace(".todo_", "")
					);
					let todo = $todosStore.todos.find(
						(todo) => todo.id === todoId
					);

					if (todo !== undefined) {
						editingTodo = todo;
					}
				}
				return (popoverOpened = false);
			}}
		>
			<div slot="after">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-pencil"
					><path
						d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
					/><path d="m15 5 4 4" />
				</svg>
			</div>
		</ListItem>

		<!-- DELETE TODO BUTTON -->
		<ListItem
			title="Delete Todo"
			link
			class="bg-red-500/5 hover:bg-red-500/30 rounded-xl transition-all"
			chevron={false}
			onClick={() => {
				if (typeof popoverTargetEl === "string") {
					let todoId = parseInt(
						popoverTargetEl.replace(".todo_", "")
					);
					deleteAlertOpen = true;
					let todo = $todosStore.todos.find(
						(todo) => todo.id === todoId
					);
					if (todo !== undefined) {
						todoToDelete = todo;
					}
				}
				return (popoverOpened = false);
			}}
		>
			<div slot="after">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-trash-2"
					><path d="M3 6h18" /><path
						d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
					/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line
						x1="10"
						x2="10"
						y1="11"
						y2="17"
					/><line x1="14" x2="14" y1="11" y2="17" />
				</svg>
			</div>
		</ListItem>
	</List>
</Popover>
