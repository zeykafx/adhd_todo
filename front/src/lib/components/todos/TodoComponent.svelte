<script lang="ts">
	import { Button, ListItem, Checkbox, List } from "konsta/svelte";
	import dayjs from "dayjs";
	import clsx from "clsx";
	import todosStore, { type Todo } from "./todosStore";
	import TodoInput from "./TodoInput.svelte";

	export let editingTodo: Todo | null = null;
	export let todo: Todo;
	export let openPopover: (targetEl: string | HTMLElement) => void;
	export let editInDb: (
		id: number,
		order: number,
		content: string,
		done: boolean
	) => void;

	let editingTodoElem: HTMLElement | undefined;
</script>

<ListItem
	label={editingTodo !== todo}
	class={clsx(
		editingTodo === todo
			? "border border-green-300 focus-within:border-green-500 rounded-xl cursor-text"
			: ""
	)}
	titleWrapClass={todo.done
		? "line-through text-black/50 dark:text-white/50"
		: ""}
>
	<div
		slot="title"
		role="textbox"
		tabindex="0"
		class={clsx(editingTodo === todo ? "cursor-text" : "")}
		contenteditable={editingTodo === todo}
		bind:this={editingTodoElem}
		on:dblclick={() => {
			editingTodo = todo;
		}}
		on:keypress={(e) => {
			if (e.code === "Enter" && editingTodoElem !== undefined) {
				editInDb(
					todo.id,
					todo.order,
					editingTodoElem.innerText,
					todo.done
				);
				editingTodo = null;
			}
		}}
	>
		{todo.content}
	</div>

	<div slot="text">
		{dayjs(todo.created_at).fromNow()}
	</div>

	<Checkbox
		aria-label="drag-handle"
		slot="media"
		component="div"
		name="todo-done"
		checked={todo.done}
		onChange={() => {
			let order = $todosStore.todos.findIndex((t) => t.id === todo.id);
			editInDb(todo.id, order, todo.content, !todo.done);
			return (todo.done = !todo.done);
		}}
	/>

	<Button
		class={"todo_" + todo.id.toString()}
		slot="after"
		clear
		small
		rounded
		onClick={() => {
			if (editingTodo === todo && editingTodoElem !== undefined) {
				editInDb(
					todo.id,
					todo.order,
					editingTodoElem.innerText,
					todo.done
				);
				editingTodo = null;
			} else {
				openPopover(".todo_" + todo.id.toString());
			}
		}}
	>
		{#if editingTodo === todo}
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
				class="lucide lucide-save"
			>
				<path
					d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
				/>
				<polyline points="17 21 17 13 7 13 7 21" />
				<polyline points="7 3 7 8 15 8" />
			</svg>
		{:else}
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
				class="lucide lucide-more-vertical"
			>
				<circle cx="12" cy="12" r="1" />
				<circle cx="12" cy="5" r="1" />
				<circle cx="12" cy="19" r="1" />
			</svg>
		{/if}
	</Button>

	<div class="pl-7">
		<!-- Subtasks -->
		{#each $todosStore.todos.filter((t) => t.parent_id === todo.id && t.is_subtask) as subtask (subtask.id)}
			<!-- {subtask.content} -->
			<svelte:self {editingTodo} todo={subtask} {openPopover} {editInDb} />
		{/each}

		{#if $todosStore.addingSubtask && $todosStore.addingSubtaskParentId === todo.id}
			<!-- subtask input -->
			<TodoInput parentId={todo.id} />
		{/if}
		<!-- <ListItem link chevron={false}>
			<Checkbox slot="media" />
			<div slot="title">Created at</div>
			<div slot="text">{dayjs(todo.created_at).fromNow()}</div>
		</ListItem> -->
	</div>
</ListItem>
