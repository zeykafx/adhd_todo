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
});
