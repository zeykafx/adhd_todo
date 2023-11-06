import { initializeApp } from "firebase/app";
import {getAuth, type User} from "firebase/auth"
import { writable } from "svelte/store";

const firebaseConfig = {
	apiKey: "AIzaSyCFVf8j9UUWlam9jvRPNv8eXaesAJiC9hw",
	authDomain: "pomofocus-a756f.firebaseapp.com",
	projectId: "pomofocus-a756f",
	storageBucket: "pomofocus-a756f.appspot.com",
	messagingSenderId: "375587774710",
	appId: "1:375587774710:web:2e22d152adea4a4b7eccd7",
	measurementId: "G-Q52SC114WP"
  };

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);


const authStore = writable<{
	isLoggedIn: boolean;
	user?: User | null;
}>({
	isLoggedIn: false,
	user: null
});

export default authStore;
