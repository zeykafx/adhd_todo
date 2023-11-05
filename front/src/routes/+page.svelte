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
    import {fade, slide} from "svelte/transition";

    let workerUrl = getWorkerUrl();
    let content = "";
    let todos: Array<Todo> = [];
    let deleteAlertOpen = false;
    let todoToDelete: Todo | null = null;

    interface Todo {
        id: number;
        content: string;
        created_at: Date;
        updated_at: Date;
        done: boolean;
        user_id: number;
    }

    function addTodo({id, content, created_at, updated_at, done, user_id}: {
        id: number,
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

            // parse the json
            for (let element of res) {
                addTodo({
                    id: element.id,
                    content: element.content,
                    created_at: element.created_at,
                    updated_at: element.updated_at,
                    done: element.done,
                    user_id: element.user_id
                });
            }
            console.log("todos", todos);
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
            toast.success("Deleted from db");
            todos = todos.filter(todo => todo.id !== id);
        });
    }

    function addToDb() {
        let done = false;
        let created_at = new Date().getTime().toString();
        let user_id = 1;
        fetch(workerUrl + "/todos/add", {
            method: "POST",
            body: JSON.stringify({content: content, done: done, created_at: created_at, user_id: user_id}),
            headers: {
                "Content-Type": "application/json",
            },
        }).then(res => res.json()).then(res => {
            toast.success("Added to db");

            // parse the json
            for (let element of res) {
                addTodo({
                    id: element.id,
                    content: element.content,
                    created_at: element.created_at,
                    updated_at: element.updated_at,
                    done: element.done,
                    user_id: element.user_id
                });
            }

            // reset the input field value
            content = "";
        });
    }

    dayjs.extend(relativeTime)


    onMount(() => {
        fetchDbContents();

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
            {#each todos as todo}
                <div transition:slide>
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
                                onChange={() => todo.done = !todo.done}
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
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
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
        </List>

    </Block>

    <Block>
        <BlockTitle>New Todo</BlockTitle>

        <List>
            <div class="flex flex-row gap-2 items-center justify-center">
                <ListInput
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
    <svelte:fragment slot="title">Delete Todo</svelte:fragment>
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

