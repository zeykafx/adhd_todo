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
	parent_id: integer("parent_id"),
	has_been_broken_down: integer("has_been_broken_down", {mode: "boolean"}).default(false),
});
