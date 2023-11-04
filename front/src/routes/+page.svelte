<script>
    import toast, {Toaster} from "svelte-french-toast";
    import {Page, Navbar, Block, Button} from 'konsta/svelte';

    import {onMount} from "svelte";

    // onMount(() => {
    //     toast("Hello world!");
    // });
    function hello() {
        toast.success("Hello world");
    }
</script>


<Page>
    <Navbar title="Focus Flow"/>
    <Block>
        <Button tonal onClick={hello}>Button</Button>
    </Block>
</Page>


<Toaster position={"bottom-right"}/>

