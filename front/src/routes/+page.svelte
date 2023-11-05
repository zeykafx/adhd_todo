<script lang="ts">
    import toast, {Toaster} from "svelte-french-toast";
    import {
        Page,
        Navbar,
        Block,
        Button,
        ListInput,
        List,
        BlockTitle,
        ListItem,
        Checkbox,
        Dialog,
        DialogButton
    } from 'konsta/svelte';
    import {onMount} from "svelte";
    import {getWorkerUrl} from "$lib";
    import dayjs from "dayjs";
    import relativeTime from "dayjs/plugin/relativeTime";
    import {slide} from "svelte/transition";
    import {flip} from "svelte/animate";
    import {dndzone, type DndEvent} from "svelte-dnd-action";

    dayjs.extend(relativeTime)

    // state
    let workerUrl = getWorkerUrl();
    let content = "";
    let todos: Array<Todo> = [];
    let deleteAlertOpen = false;
    let todoToDelete: Todo | null = null;

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

            console.log(todos);

            todos = todos.sort((a, b) => {
                return a.order - b.order;
            });
        });
    }

    function addToDb() {

        let done = false;
        let created_at = new Date().getTime().toString();
        let user_id = 1;
        let order = todos.length + 1;

        fetch(workerUrl + "/todos/add", {
            method: "POST",
            body: JSON.stringify({
                order: order,
                content: content,
                done: done,
                created_at: created_at,
                user_id: user_id
            }),
            headers: {
                "Content-Type": "application/json",
            },
        }).then(res => res.json()).then(res => {
            toast.success("Added Todo");

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

            // reset the input field value
            content = "";
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

            todos = todos.map(todo => {
                if (todo.id === res.id) {
                    todo.order = res.order;
                    todo.content = res.content;
                    todo.done = res.done;
                }
                return todo;
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

        // edit the order of all the todos in the db
        for (let index = 0; index < todos.length; index++) {
            const todo = todos[index];
            editInDb(todo.id, index, todo.content, todo.done);
        }
    }

    onMount(() => {
        fetchDbContents();

        // add event listener for enter key
        document.getElementById("input_field")?.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                addToDb();
            }
        });

        const interval = setInterval(() => {
            console.log("refreshing todos");
            todos = todos;
        }, 60000);

        return () => clearInterval(interval);
    });

</script>


<Page>
    <Navbar title="Focus Flow"/>

    <Block>
        <BlockTitle>To do</BlockTitle>

        <List>


            <section
                    class="w-full h-full overflow-hidden border border-md-light-primary/20 dark:border-md-dark-primary/20 rounded-xl transition-all"
                    use:dndzone="{{items: todos, flipDurationMs, dropTargetStyle}}"
                    on:consider={handleDndConsider}
                    on:finalize={handleDndFinalize}
            >
                {#each todos as todo(todo.id)}
                    <div animate:flip="{{duration:flipDurationMs}}">
                        <ListItem
                                label
                                title={todo.content}
                                titleWrapClass={todo.done ? "line-through text-black/50 dark:text-white/50" : ""}
                                text={dayjs(todo.created_at).fromNow()}
                        >
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
                                    slot="after"
                                    clear
                                    small
                                    rounded
                                    onClick={() =>{
                                        todoToDelete = todo;
                                        deleteAlertOpen = true;
                                    }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                     fill="none"
                                     stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                     stroke-linejoin="round"
                                     class="lucide lucide-trash-2">
                                    <path d="M3 6h18"/>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                    <line x1="10" x2="10" y1="11" y2="17"/>
                                    <line x1="14" x2="14" y1="11" y2="17"/>
                                </svg>
                            </Button>
                        </ListItem>
                    </div>

                {:else}
                    <ListItem title="Nothing to do!"/>
                {/each}
            </section>
        </List>

    </Block>

    <Block>
        <BlockTitle>New Todo</BlockTitle>

        <List>
            <div class="flex flex-row gap-2 items-center justify-center">
                <ListInput
                        id="input_field"
                        class="w-full"
                        outline
                        label="Content"
                        type="text"
                        placeholder="Content"
                        floatingLabel
                        value={content}
                        onInput={(e) => content = e.target.value}
                />
                <Button rounded onClick={addToDb} class="w-min mx-auto mt-2">
                    Add
                </Button>
            </div>

        </List>
    </Block>
</Page>

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

<Toaster position={"bottom-right"}/>

