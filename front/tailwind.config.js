const konstaConfig = require('konsta/config');

/** @type {import('tailwindcss').Config} */
export default konstaConfig({
    darkMode: "class",
    konsta: {
        colors: {
            // "primary" is the main app color, if not specified will be default to '#007aff'
            primary: '#e63c3c',
            'brand-red': '#ff0000',
			'brand-green': '#00ff00',
            'brand-blue': '#0080ff',
        }
    },
    content: ['./src/**/*.{html,js,svelte,ts}'], theme: {
        extend: {},
    },
    plugins: [

    ],
})
