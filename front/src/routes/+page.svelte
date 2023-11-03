<script>
    import toast, {Toaster} from "svelte-french-toast";
    import {AppBar, AppShell} from '@skeletonlabs/skeleton';

    import { LightSwitch } from '@skeletonlabs/skeleton';
    import {onMount} from "svelte";

    // onMount(() => {
    //     toast("Hello world!");
    // });
</script>

<AppShell>
    <svelte:fragment slot="header">
        <AppBar>
            <svelte:fragment slot="lead">
                <h1 class="h1 text-2xl font-bold">Magic Todo</h1>
            </svelte:fragment>

            <svelte:fragment slot="trail">
                <LightSwitch/>
            </svelte:fragment>
        </AppBar>
    </svelte:fragment>

    <svelte:fragment>
        <h2>content</h2>
        <button class="btn variant-soft-primary" on:click={() => toast.success("Hello world")}>Show toast</button>
    </svelte:fragment>

</AppShell>

<Toaster/>

