<script>
    import toast, {Toaster} from "svelte-french-toast";
    import {Page, Navbar, Block, Button} from 'konsta/svelte';

    import {onMount} from "svelte";
    import {getWorkerUrl} from "$lib";

    // onMount(() => {
    //     toast("Hello world!");
    // });
    function hello() {
        let workerUrl = getWorkerUrl();
        console.log(workerUrl)
        fetch(workerUrl + "/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }).then(r => r.json()).then(r => {
            toast.success(r.rows[0][0]);
            console.log(r);
        });
    }
</script>


<Page>
    <Navbar title="Focus Flow"/>
    <Block>
        <Button tonal onClick={hello}>Button</Button>
    </Block>
</Page>


<Toaster position={"bottom-right"}/>

