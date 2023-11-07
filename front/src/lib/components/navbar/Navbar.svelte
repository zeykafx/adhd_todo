<script lang="ts">
	import { Navbar, Button, List, ListItem, Popover } from "konsta/svelte";
	import { onMount } from "svelte";
	import authStore, { auth } from "$lib/firebase/firebase";
	import { onAuthStateChanged } from "firebase/auth";

	let currentTheme: string = "dark";

	function toggleTheme() {
		currentTheme = currentTheme === "light" ? "dark" : "light";
		window.setMode(currentTheme);
	}

	let popoverOpened = false;
	let popoverTargetEl: string | HTMLElement | null = null;

	const openPopover = (targetEl: string | HTMLElement) => {
		popoverTargetEl = targetEl;
		popoverOpened = true;
	};

	function handleSignOut() {
		auth.signOut();
		$authStore.user = null;
		$authStore.isLoggedIn = false;
	}

	onMount(() => {
		let theme = window.localStorage.getItem("theme");
		if (theme !== null) {
			currentTheme = theme;
		}

		onAuthStateChanged(
			auth,
			(user) => {
				$authStore.user = user;
				$authStore.isLoggedIn = user !== null;
			},
			(error) => {
				console.log(error);
			}
		);
	});
</script>

<Navbar>
	<div slot="title">
		<a href="/" class="text-xl font-bold">Pomofocus</a>
	</div>

	<div slot="right" class="flex flex-row gap-4 items-center justify-center">
		<Button onClick={() => toggleTheme()} tonal rounded class="w-min">
			{#if currentTheme === "light"}
				<!-- Moon icon -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-moon"
					><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg
				>
			{:else}
				<!-- Sun icon -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-sun-moon"
					><path d="M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4" /><path
						d="M12 2v2"
					/><path d="M12 20v2" /><path d="m4.9 4.9 1.4 1.4" /><path
						d="m17.7 17.7 1.4 1.4"
					/><path d="M2 12h2" /><path d="M20 12h2" /><path
						d="m6.3 17.7-1.4 1.4"
					/><path d="m19.1 4.9-1.4 1.4" /></svg
				>
			{/if}
		</Button>

		<!-- Avatar -->
		{#if $authStore.user !== null}
			<button on:click={() => openPopover(".avatar")}>
				<img
					src={$authStore.user?.photoURL}
					alt="avatar"
					class="w-9 h-9 rounded-full mr-3 avatar"
				/>
			</button>
		{/if}
	</div>
</Navbar>

<Popover
	opened={popoverOpened}
	target={popoverTargetEl}
	onBackdropClick={() => (popoverOpened = false)}
>
	<List nested class="p-3">
		<ListItem>
			<div slot="title">
				Signed in as <span class="font-bold">{$authStore.user?.displayName}</span>
			</div>
		</ListItem>
		<ListItem
			link
			class="text-bold bg-red-500/5 hover:bg-red-500/30 rounded-xl transition-all"
			title="Sign out"
			chevron={false}
			onClick={() => {
				handleSignOut();
				return (popoverOpened = false);
			}}
		>
			<div slot="after">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-log-out"
					><path
						d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
					/><polyline points="16 17 21 12 16 7" /><line
						x1="21"
						x2="9"
						y1="12"
						y2="12"
					/></svg
				>
			</div>
		</ListItem>
	</List>
</Popover>
