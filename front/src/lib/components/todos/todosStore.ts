import { browser } from "$app/environment";
import { writable } from "svelte/store";

export interface Todo {
	id: number;
	order: number;
	content: string;
	created_at: Date;
	updated_at: Date;
	done: boolean;
	user_id: number;
	is_subtask: boolean;
	parent_id: number | null;
}

let localTodos = loadTodosFromLocalStorage();

let todosStore = writable<{
	todos: Array<Todo>;
	loading: boolean;
	fetchedOnce: boolean;
	addingSubtask: boolean;
	addingSubtaskParentId: number | null;
}>({
	todos: localTodos,
	loading: false,
	fetchedOnce: false,
	addingSubtask: false,
	addingSubtaskParentId: null,
});

export default todosStore;

if (browser) {
	todosStore.subscribe((store) => {
		localStorage.setItem("todos", JSON.stringify(store.todos));
	});
}

function loadTodosFromLocalStorage(): Array<Todo> {
	if (!browser) {
		return Array<Todo>();
	}

	let localStorageTodos = localStorage.getItem("todos");

	if (localStorageTodos === null) {
		localStorage.setItem("todos", JSON.stringify([]));
		return Array<Todo>();

	} else {
		let storedTodos = JSON.parse(localStorageTodos);
		return storedTodos;
	}
}

export function addTodo({
	id,
	order,
	content,
	created_at,
	updated_at,
	done,
	user_id,
	is_subtask,
	parent_id,
}: {
	id: number;
	order: number;
	content: string;
	created_at: string;
	updated_at: string;
	done: boolean;
	user_id: number;
	is_subtask: boolean;
	parent_id: number | null;
}) {
	let created_at_date: Date = new Date(parseInt(created_at));
	let updated_at_date: Date = new Date(parseInt(updated_at));

	todosStore.update((store) => {
		store.todos.push({
			id,
			order,
			content,
			created_at: created_at_date,
			updated_at: updated_at_date,
			done,
			user_id,
			is_subtask,
			parent_id,
		});
		return store;
	});
}
