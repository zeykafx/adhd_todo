import {
	integer,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";


export let todos = sqliteTable("todos", {
	id: integer("id").primaryKey({autoIncrement: true}),
	order: integer("order"),
	content: text("content"),
	done: integer("done", {mode: "boolean"}),
	created_at: text("created_at"),
	updated_at: text("updated_at"),
	user_id: text("user_id").notNull(),
	is_subtask: integer("is_subtask", {mode: "boolean"}),
	has_subtasks: integer("has_subtasks", {mode: "boolean"}),
	parent_id: integer("parent_id"),
	has_been_broken_down: integer("has_been_broken_down", {mode: "boolean"}).default(false),
});


export let users = sqliteTable("users", {
	id: text("id").primaryKey(),
	username: text("username"),
	email: text("email"),
	has_limit: integer("has_limit", {mode: "boolean"}),
	last_time_broke_down: text("last_time_broke_down"),
	number_of_breakdowns_today: integer("number_of_breakdowns_today"),
});
