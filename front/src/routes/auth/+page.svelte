<script lang="ts">
	import Navbar from "$lib/components/navbar/Navbar.svelte";
	import { auth } from "$lib/firebase/firebase";
	import {
		GoogleAuthProvider,
		getAdditionalUserInfo,
		signInWithPopup,
	} from "firebase/auth";
	import { Block, BlockTitle, Button, Page } from "konsta/svelte";
	import toast from "svelte-french-toast";
	import authStore from "$lib/firebase/firebase";
	import { goto } from "$app/navigation";
	import { getWorkerUrl } from "$lib";

	let workerUrl = getWorkerUrl();

	async function signInWithGoogle() {
		console.log("sign in with google");

		const provider = new GoogleAuthProvider();

		signInWithPopup(auth, provider)
			.then((result) => {
				let addInfo = getAdditionalUserInfo(result);
				console.log(addInfo?.isNewUser);
				if (addInfo !== null && addInfo.isNewUser) {
					// make a request to the backend to create a new user in the db
					fetch(workerUrl + "/auth/create", {
						method: "POST",
						body: JSON.stringify({
							id: result.user.uid,
							email: result.user.email,
							displayName: result.user.displayName,
						}),
						headers: {
							"Content-Type": "application/json",
						},
					})
						.then((data) => {
							console.log(data);
						})
						.catch((err) => {
							console.log(err);
						});
				}

				// The signed-in user info.
				const user = result.user;

				$authStore.user = user;
				$authStore.isLoggedIn = user !== null;

				goto("/");

				// IdP data available using getAdditionalUserInfo(result)
				// ...
			})
			.catch((error) => {
				// Handle Errors here.
				// const errorCode = error.code;
				const errorMessage = error.message;

				toast.error(errorMessage, {
					duration: 10000,
					position: "bottom-right",
				});
			});
	}

	$: {
		if ($authStore.isLoggedIn) {
			goto("/");
		}
	}
</script>

<Page>
	<Navbar />
	<div
		class="w-full flex flex-col items-center justify-center max-w-screen-lg mx-auto px-4"
	>
		<div class="w-full">
			<BlockTitle>Sign in</BlockTitle>

			<Block
				strong
				inset
				class="flex flex-col items-center justify-center"
			>
				<p class="text-center pb-3">
					Sign in to Pomofocus to save your tasks and sync them across
					devices.
				</p>

				<Button tonal rounded onClick={() => signInWithGoogle()}>
					Sign in with Google
				</Button>

				<p class="text-2xs text-black/50 dark:text-white/50 pt-1">
					Authentication is handled by Firebase (Google).
				</p>
			</Block>
		</div>
	</div>
</Page>