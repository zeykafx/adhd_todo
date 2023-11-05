import {
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";

export const example = sqliteTable("example", {
    id: integer("id").primaryKey({autoIncrement: true}),
    content: text("content")
});


export const todos = sqliteTable("todos", {
	id: integer("id").primaryKey({autoIncrement: true}),
	content: text("content"),
	done: integer("done", {mode: "boolean"}),
	created_at: text("created_at"),
	updated_at: text("updated_at"),
	user_id: integer("user_id").notNull(),
});
