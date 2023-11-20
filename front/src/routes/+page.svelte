<script lang="ts">
	import Navbar from "$lib/components/navbar/Navbar.svelte";
	import Todo from "$lib/components/todos/Todo.svelte";
	import { Page } from "konsta/svelte";
	import { onMount } from "svelte";
	import authStore from "$lib/firebase/firebase";
	import { goto } from "$app/navigation";
	import { browser } from "$app/environment";

	onMount(() => {
		if (!$authStore.isLoggedIn) {
			goto("/auth");
		}
	});

	$: {
		if (browser && !$authStore.isLoggedIn) {
			goto("/auth");
		}
	}
</script>

<Page>
	<Navbar />

	{#if $authStore.isLoggedIn}
		<Todo />
	{/if}
</Page>
