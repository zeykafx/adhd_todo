<script lang="ts">
	import toast from "svelte-french-toast";
	import {
		Block,
		List,
		BlockTitle,
		ListItem,
		Dialog,
		DialogButton,
		Popover,
		Preloader,
		Button,
	} from "konsta/svelte";
	import { onMount } from "svelte";
	import { getWorkerUrl } from "$lib";
	import dayjs from "dayjs";
	import relativeTime from "dayjs/plugin/relativeTime";
	import { flip } from "svelte/animate";
	import { dndzone, type DndEvent } from "svelte-dnd-action";
	import TodoInput from "$lib/components/todos/TodoInput.svelte";
	import authStore, { auth } from "$lib/firebase/firebase";
	import todosStore, { type Todo, addTodo } from "./todosStore";
	import TodoComponent from "./TodoComponent.svelte";
	import clsx from "clsx";
	import { signOut } from "firebase/auth";

	dayjs.extend(relativeTime);
	let workerUrl = getWorkerUrl();

	// delete, edit todo state
	let deleteAlertOpen = false;
	let todoToDelete: Todo | null = null;
	let editingTodo: Todo | null = null;

	// popover state
	let popoverOpened = false;
	let popoverTargetEl: string | HTMLElement | null = null;

	let popoverTargetIsSubtask = false;
	let popoverTargetHasSubtasks = false;

	// don't show the "add subtask" to subtasks, and also don't show the "clear subtasks" to todos that don't have subtasks
	$: {
		if (typeof popoverTargetEl === "string") {
			let todoId = parseInt(popoverTargetEl.replace(".todo_", ""));
			let todo = $todosStore.todos.find((todo) => todo.id === todoId);

			if (todo?.is_subtask) {
				popoverTargetIsSubtask = true;
			} else {
				popoverTargetIsSubtask = false;
				let subtasks = $todosStore.todos.filter(
					(todo) => todo.parent_id === todoId,
				);
				if (subtasks.length > 0) {
					popoverTargetHasSubtasks = true;
				} else {
					popoverTargetHasSubtasks = false;
				}
			}
		}
	}

	const openPopover = (targetEl: string | HTMLElement) => {
		// console.log("opening popover", targetEl)
		popoverTargetEl = targetEl;
		popoverOpened = true;
		// console.log("popover target el", popoverTargetEl)
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
				if (res.error !== undefined) {
					toast.error(res.error);
					$todosStore.loading = false;
					$authStore.isLoggedIn = false;
					$authStore.user = null;
					auth.signOut();
					return;
				}

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
						has_subtasks: element.has_subtasks,
						parent_id: element.parent_id,
						has_been_broken_down: element.has_been_broken_down,
					});
				}

				$todosStore.loading = false;
			})
			.catch((e) => {
				console.log(e);
				toast.error("Error fetching todos");
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
						(todo) => todo.id !== element.id,
					);
				}


			});
	}

	async function editInDb(
		id: number,
		order: number,
		content: string,
		done: boolean,
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

	async function breakdownTodo(todo: Todo) {
		if (todo.has_been_broken_down) {
			toast.error(
				"Sorry, this todo has already been broken down, to save cost, I only allow breaking down a todo once. You can still duplicate it and break down the duplicate.",
				{
					duration: 20000,
				},
			);
			return;
		}

		$todosStore.loadingAITodo = todo.id;

		let userToken = await $authStore.user?.getIdToken();
		let user_id = $authStore.user?.uid!;

		fetch(workerUrl + "/ai/breakdown", {
			method: "POST",
			body: JSON.stringify({
				message: todo.content,
				user_id: user_id,
				todo_id: todo.id,
			}),
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + userToken,
			},
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.error !== undefined) {
					toast.error(res.error, {
						duration: 20000,
					});
					$todosStore.loadingAITodo = null;
					return;
				}

				toast.success("Todo broken down!");

				// set the todo as broken down
				$todosStore.todos = $todosStore.todos.map((t) => {
					if (t.id === todo.id) {
						t.has_been_broken_down = true;
					}
					return t;
				});

				// add the subtasks
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
				$todosStore.loadingAITodo = null;
			})
			.catch((e) => {
				console.log(e);
				toast.error("Error breaking down todo");
				$todosStore.loadingAITodo = null;
			});
	}

	async function clearSubtasks(todo: Todo) {
		let userToken = await $authStore.user?.getIdToken();

		fetch(workerUrl + "/todos/clearsubtasks", {
			method: "PUT",
			body: JSON.stringify({
				todo: todo,
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

				//  remove the todos that got cleared
				for (let element of res) {
					$todosStore.todos = $todosStore.todos.filter(
						(todo) => todo.id !== element.id,
					);
				}
			});
	}

	// DND Stuff
	let flipDurationMs = 300;
	let dropTargetStyle = {
		"border-color": "rgb(var(--k-color-md-dark-primary))",
	};
	let dragDisabled = true;

	function startDrag(e: any) {
		e.preventDefault();
		dragDisabled = false;
	}

	function handleDndConsider(e: CustomEvent<DndEvent<Todo>>) {
		$todosStore.todos = e.detail.items;
		dragDisabled = true;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<Todo>>) {
		$todosStore.todos = e.detail.items;
		dragDisabled = true;
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
						dragDisabled,
						dropTargetStyle,
					}}
					on:consider={handleDndConsider}
					on:finalize={handleDndFinalize}
				>
					{#each $todosStore.todos as todo (todo.id)}
						<div
							animate:flip={{ duration: flipDurationMs }}
							class="flex flex-row gap-0.5 items-baseline justify-start"
						>
							{#if !todo.is_subtask}
								<div class="flex flex-col">
									<!-- Drag handle -->
									<!-- svelte-ignore a11y-no-static-element-interactions -->
									<div
										class={clsx(
											"pl-4 w-min text-md-light-primary dark:text-md-dark-primary",
											dragDisabled
												? "cursor-grab"
												: "cursor-grabbing",
										)}
										on:mousedown={startDrag}
										on:touchstart={startDrag}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="22"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											class="pt-1 lucide lucide-grip-vertical"
										>
											<circle cx="9" cy="12" r="1" />
											<circle cx="9" cy="5" r="1" />
											<circle cx="9" cy="19" r="1" />
											<circle cx="15" cy="12" r="1" />
											<circle cx="15" cy="5" r="1" />
											<circle cx="15" cy="19" r="1" />
										</svg>
									</div>

									{#if todo.has_subtasks}
										<div class="shrink pt-3">
											<Button
												clear
												small
												rounded
												onClick={() => {
													// set "subtasks_hidden" to false
													$todosStore.todos = $todosStore.todos.map(
														(t) => {
															if (
																t.id ===
																todo.id
															) {
																t.subtasks_hidden = !t.subtasks_hidden;
															}
															return t;
														},
													);
												}}
											>
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
													class={clsx("lucide lucide-chevron-up transition", todo.subtasks_hidden ? "rotate-180" : "rotate-0")}
												>
													<polyline points="18 15 12 9 6 15" />
												</svg>
											</Button>
										</div>
									{/if}

								</div>
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
	onBackdropClick={() => {
		popoverTargetEl = null;
		popoverOpened = false;
	}}
>
	<List nested class="p-3">
		{#if !popoverTargetIsSubtask}
			<!-- Breakdown todo -->
			<div
				class="animate-background rounded-xl bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 p-0.5 transition bg-[length:400%_400%] [animation-duration:_4s]"
			>
				<ListItem
					title="Breakdown using AI"
					link
					class="rounded-xl bg-md-light-surface-3/95 dark:bg-md-dark-surface-3/80"
					chevron={false}
					onClick={() => {
						if (typeof popoverTargetEl === "string") {
							let todoId = parseInt(
								popoverTargetEl.replace(".todo_", ""),
							);
							let todo = $todosStore.todos.find(
								(todo) => todo.id === todoId,
							);

							// Shouldn't happen but we can check just in case
							if (todo?.is_subtask) {
								toast.error("Can't breakdown subtask");
								return (
									(popoverOpened = false),
									(popoverTargetEl = null)
								);
							}

							if (todo !== undefined) {
								breakdownTodo(todo);
							}
						}
						return (
							(popoverOpened = false), (popoverTargetEl = null)
						);
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
							class="lucide lucide-sparkles"
							><path
								d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
							/><path d="M5 3v4" /><path d="M19 17v4" /><path
								d="M3 5h4"
							/><path d="M17 19h4" /></svg
						>
					</div>
				</ListItem>
			</div>

			<!-- ADD SUBTASK BUTTON -->
			<ListItem
				title="Add subtask"
				link
				chevron={false}
				class="hover:bg-md-light-outline/10 dark:hover:bg-md-dark-outline/10 rounded-xl transition-all"
				onClick={() => {
					if (typeof popoverTargetEl === "string") {
						let todoId = parseInt(
							popoverTargetEl.replace(".todo_", ""),
						);
						let todo = $todosStore.todos.find(
							(todo) => todo.id === todoId,
						);

						// Shouldn't happen but we can check just in case
						if (todo?.is_subtask) {
							toast.error("Can't add subtask to subtask");
							return (popoverOpened = false);
						}

						$todosStore.addingSubtask = true;
						$todosStore.addingSubtaskParentId = todoId;
					}
					return (popoverOpened = false), (popoverTargetEl = null);
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
		{/if}

		<!-- EDIT TODO BUTTON -->
		<ListItem
			title="Edit Todo"
			link
			class="hover:bg-md-light-outline/10 dark:hover:bg-md-dark-outline/10 rounded-xl transition-all"
			chevron={false}
			onClick={() => {
				if (typeof popoverTargetEl === "string") {
					let todoId = parseInt(
						popoverTargetEl.replace(".todo_", ""),
					);
					let todo = $todosStore.todos.find(
						(todo) => todo.id === todoId,
					);

					if (todo !== undefined) {
						editingTodo = todo;
					}
				}
				return (popoverOpened = false), (popoverTargetEl = null);
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

		<!-- CLEAR SUBTASKS BUTTON -->
		{#if popoverTargetHasSubtasks && !popoverTargetIsSubtask}
			<ListItem
				title="Clear subtasks"
				link
				class="bg-red-500/5 hover:bg-red-500/30 rounded-xl transition-all"
				chevron={false}
				onClick={() => {
					if (typeof popoverTargetEl === "string") {
						let todoId = parseInt(
							popoverTargetEl.replace(".todo_", ""),
						);
						let todo = $todosStore.todos.find(
							(todo) => todo.id === todoId,
						);
						if (todo !== undefined) {
							clearSubtasks(todo);
						}
					}
					return (popoverOpened = false), (popoverTargetEl = null);
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
						class="lucide lucide-list-minus"
						><path d="M11 12H3" /><path d="M16 6H3" /><path
							d="M16 18H3"
						/><path d="M21 12h-6" /></svg
					>
				</div>
			</ListItem>
		{/if}

		<!-- DELETE TODO BUTTON -->
		<ListItem
			title="Delete Todo"
			link
			class="bg-red-500/5 hover:bg-red-500/30 rounded-xl transition-all"
			chevron={false}
			onClick={() => {
				if (typeof popoverTargetEl === "string") {
					let todoId = parseInt(
						popoverTargetEl.replace(".todo_", ""),
					);
					deleteAlertOpen = true;
					let todo = $todosStore.todos.find(
						(todo) => todo.id === todoId,
					);
					if (todo !== undefined) {
						todoToDelete = todo;
					}
				}
				return (popoverOpened = false), (popoverTargetEl = null);
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
