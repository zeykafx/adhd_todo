<script>
	import { Toaster } from "svelte-french-toast";
    import "../app.css";
    import {App} from "konsta/svelte";
</script>

<App theme="material">
    <slot/>
    
    <Toaster position={"bottom-right"}/>
</App>
