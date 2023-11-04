<script lang="ts">
    import toast, {Toaster} from "svelte-french-toast";
    import {Page, Navbar, Block, Button, ListInput, List, BlockTitle, ListItem} from 'konsta/svelte';
    import {onMount} from "svelte";
    import {getWorkerUrl} from "$lib";

    let workerUrl = getWorkerUrl();
    let content = "";
    let dbContents: Array<DbContent> = [];

    interface DbContent {
        id: number;
        content: string;
    }

    function fetchDbContents() {
        fetch(workerUrl + "/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }).then(r => r.json()).then(r => {
            dbContents = [];

            // parse the json
            for (let rElement of r) {
                dbContents = [...dbContents, {id: rElement.id, content: rElement.content}];
            }
            console.log(r);
            console.log("dbContents", dbContents);
        });
    }

    function addToDb() {
        fetch(workerUrl + "/add", {
            method: "POST",
            body: JSON.stringify({content: content}),
            headers: {
                "Content-Type": "application/json",
            },
        }).then(r => r.json()).then(r => {
            toast.success("Added to db");
            console.log(r);

            fetchDbContents();
        });
    }

    onMount(() => {
        fetchDbContents();
    });
</script>


<Page>
    <Navbar title="Focus Flow"/>

    <Block>
        <BlockTitle>DB Contents</BlockTitle>

        <List>
            {#each dbContents as dbContent}
                <ListItem title={dbContent.content}/>
            {:else}
                <ListItem title="No contents"/>
            {/each}
        </List>

    </Block>

    <Block>
        <BlockTitle>Add To DB</BlockTitle>

        <List>
            <ListInput label="Content" type="text" placeholder="Content" onInput={(e) => content = e.target.value}/>
            <Button tonal onClick={addToDb} class="w-min mx-auto mt-2">Add</Button>
        </List>
    </Block>
</Page>


<Toaster position={"bottom-right"}/>

