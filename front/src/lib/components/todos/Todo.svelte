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
        Popover
    } from 'konsta/svelte';
    import {onMount, SvelteComponent} from "svelte";
    import {getWorkerUrl} from "$lib";
    import dayjs from "dayjs";
    import relativeTime from "dayjs/plugin/relativeTime";
    import {flip} from "svelte/animate";
    import {dndzone, type DndEvent} from "svelte-dnd-action";
    import TodoInput from "$lib/components/todos/TodoInput.svelte";
    import clsx from "clsx";

    dayjs.extend(relativeTime)

    // state
    let workerUrl = getWorkerUrl();
    let todos: Array<Todo> = [];

    let deleteAlertOpen = false;
    let todoToDelete: Todo | null = null;

    let editingTodo: Todo | null = null;
    let editingTodoElem: HTMLElement | undefined;

    let popoverOpened = false;
    let popoverTargetEl: string | HTMLElement | null = null;

    const openPopover = (targetEl: string | HTMLElement) => {
        popoverTargetEl = targetEl;
        popoverOpened = true;
    };

    interface Todo {
        id: number;
        order: number;
        content: string;
        created_at: Date;
        updated_at: Date;
        done: boolean;
        user_id: number;
    }

    // methods
    function addTodo({id, order, content, created_at, updated_at, done, user_id}: {
        id: number,
        order: number,
        content: string,
        created_at: string,
        updated_at: string,
        done: boolean,
        user_id: number
    }) {
        let created_at_date: Date = new Date(parseInt(created_at));
        let updated_at_date: Date = new Date(parseInt(updated_at));

        todos = [...todos, {
            id: id,
            order: order,
            content: content,
            done: done,
            created_at: created_at_date,
            updated_at: updated_at_date,
            user_id: user_id
        }];
    }

    function fetchDbContents() {
        fetch(workerUrl + "/todos/get", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }).then(res => res.json()).then(res => {
            todos = [];

            for (let element of res) {
                addTodo({
                    id: element.id,
                    order: element.order,
                    content: element.content,
                    created_at: element.created_at,
                    updated_at: element.updated_at,
                    done: element.done,
                    user_id: element.user_id
                });
            }

            todos = todos.sort((a, b) => {
                return a.order - b.order;
            });
        });
    }

    function deleteFromDb(id: number) {
        fetch(workerUrl + "/todos/delete", {
            method: "DELETE",
            body: JSON.stringify({id: id}),
            headers: {
                "Content-Type": "application/json",
            },
        }).then(() => {
            toast.success("Deleted Todo");
            todos = todos.filter(todo => todo.id !== id);
        });
    }

    function editInDb(id: number, order: number, content: string, done: boolean) {
        let updated_at = new Date().getTime().toString();

        fetch(workerUrl + "/todos/edit", {
            method: "PUT",
            body: JSON.stringify({
                id: id,
                order: order,
                content: content,
                done: done,
                updated_at: updated_at,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        }).then((res) => res.json()).then((res) => {
            // toast.success("Edited to do");
            for (let rElem of res) {
                todos = todos.map(todo => {
             
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

    function editOrder() {
        fetch(workerUrl + "/todos/editOrder", {
            method: "PUT",
            body: JSON.stringify({
                reqTodos: todos
            }),
            headers: {
                "Content-Type": "application/json",
            },
        }).then((res) => res.json()).then((res) => {
            // toast.success("Edited to do");

            for (let element of res) {
                todos = todos.map(todo => {
                    if (todo.id === element.id) {
                        todo.order = element.order;
                    }
                    return todo;
                });
            }

            todos = todos.sort((a, b) => {
                return a.order - b.order;
            });
        });
    }

    // DND Stuff
    let flipDurationMs = 300;
    let dropTargetStyle = {
        "border-color": "rgb(var(--k-color-md-dark-primary))",
    };

    function handleDndConsider(e: CustomEvent<DndEvent<Todo>>) {
        todos = e.detail.items;
    }

    function handleDndFinalize(e: CustomEvent<DndEvent<Todo>>) {
        todos = e.detail.items;

        editOrder();
    }

    onMount(() => {
        fetchDbContents();

        // refresh the state of the todos every 60 seconds, this doesn't fetch from the db but it just
        // updates the time ago string
        const interval = setInterval(() => {
            console.log("refreshing todos");
            todos = todos;
        }, 60000);

        return () => clearInterval(interval);
    });
</script>


<div class="w-full flex flex-col items-center justify-center max-w-screen-lg mx-auto px-4">
    <div class="w-full">

        <TodoInput todos={todos} addTodo={addTodo} workerUrl={workerUrl}/>


        <Block>
            <BlockTitle>Todo list</BlockTitle>

            <List strong class="rounded-xl">
                <section
                        class="w-full h-full overflow-hidden border border-md-light-primary/20 dark:border-md-dark-primary/20 rounded-xl transition-all"
                        use:dndzone="{{items: todos, flipDurationMs, dropTargetStyle}}"
                        on:consider={handleDndConsider}
                        on:finalize={handleDndFinalize}
                >
                    {#each todos as todo(todo.id)}
                        <div animate:flip="{{duration:flipDurationMs}}">
                            <ListItem
                                    label={editingTodo !== todo}
                                    class={clsx(editingTodo === todo ? "border border-green-300 focus-within:border-green-500 rounded-xl cursor-text" : "")}
                                    titleWrapClass={todo.done ? "line-through text-black/50 dark:text-white/50" : ""}
                            >
                                <div
                                        slot="title"
                                        role="textbox"
                                        tabindex="0"
                                        class={clsx(editingTodo === todo ? "cursor-text" : "")}
                                        contenteditable={editingTodo === todo}
                                        bind:this={editingTodoElem}
                                        on:keypress={(e) => {
                                            if (e.code === "Enter" && editingTodoElem !== undefined) {
                                                  editInDb(todo.id, todo.order, editingTodoElem.innerText, todo.done);
                                                  editingTodo = null;
                                            }
                                        }}
                                >
                                    {todo.content}
                                </div>
                                <div slot="text">{dayjs(todo.created_at).fromNow()}</div>
                                <Checkbox
                                        slot="media"
                                        component="div"
                                        name="todo-done"
                                        checked={todo.done}
                                        onChange={() =>{
                                            let order = todos.findIndex(t => t.id === todo.id);
                                            editInDb(todo.id, order, todo.content, !todo.done);
                                            return todo.done = !todo.done;
                                        }}
                                />

                                <Button
                                        class={"todo_"+todo.id.toString()}
                                        slot="after"
                                        clear
                                        small
                                        rounded
                                        onClick={() =>{
                                            if (editingTodo === todo && editingTodoElem !== undefined) {
                                                editInDb(todo.id, todo.order, editingTodoElem.innerText, todo.done);
                                                editingTodo = null;
                                            } else {
                                                openPopover(".todo_"+todo.id.toString())
                                            }
                                    }}
                                >
                                    {#if editingTodo === todo}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                             stroke-linecap="round" stroke-linejoin="round"
                                             class="lucide lucide-save">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                            <polyline points="17 21 17 13 7 13 7 21"/>
                                            <polyline points="7 3 7 8 15 8"/>
                                        </svg>
                                    {:else}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                             viewBox="0 0 24 24"
                                             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                             stroke-linejoin="round" class="lucide lucide-more-vertical">
                                            <circle cx="12" cy="12" r="1"/>
                                            <circle cx="12" cy="5" r="1"/>
                                            <circle cx="12" cy="19" r="1"/>
                                        </svg>
                                    {/if}

                                </Button>
                            </ListItem>
                        </div>

                    {:else}
                        <ListItem title="Nothing to do!"/>
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
    <svelte:fragment slot="title">
        Delete Todo
    </svelte:fragment>

    Are you sure you want to delete this todo?

    <svelte:fragment slot="buttons">
        <DialogButton onClick={() => (deleteAlertOpen = false)}>Cancel</DialogButton>
        <DialogButton strong onClick={() =>{
            if(todoToDelete === null) return;

            deleteFromDb(todoToDelete.id);
            return (deleteAlertOpen = false);
        }}>
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
        <ListItem
                title="Edit Todo"
                link
                onClick={() =>{
                    if (typeof popoverTargetEl === "string") {
                        let todoId = parseInt(popoverTargetEl.replace(".todo_", ""))
                        let todo = todos.find((todo) => todo.id === todoId)

                        if (todo !== undefined) {
                            editingTodo = todo;
                        }
                    }
                    return (popoverOpened = false);
                }}
        />
        <ListItem
                title="Delete Todo"
                link
                onClick={() =>{
                    if (typeof popoverTargetEl === "string") {
                        let todoId = parseInt(popoverTargetEl.replace(".todo_", ""))
                        deleteAlertOpen = true;
                        let todo = todos.find((todo) => todo.id === todoId)
                        if (todo !== undefined) {
                            todoToDelete = todo;
                        }
                    }
                    return (popoverOpened = false);
                }}
        />

    </List>
</Popover>
