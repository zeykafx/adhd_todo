<script>
	import { Toaster } from "svelte-french-toast";
    import "../app.css";
    import {App} from "konsta/svelte";
	import { onMount } from "svelte";

	onMount(() => {
		window.setMode = (mode) => {
			if (mode === "dark") {
				document.documentElement.classList.add("dark");
				window.localStorage.setItem("theme", "dark");
				window.theme = "dark";
			} else {
				document.documentElement.classList.remove("dark");
				window.localStorage.setItem("theme", "light");
				window.theme = "light";
			}
		};

		let theme = window.localStorage.getItem("theme");
		if (theme !== null) {
			window.setMode(theme)
		}
	});
</script>

<App theme="material">
    <slot/>

    <Toaster position={"bottom-right"}/>
</App>
