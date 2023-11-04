const konstaConfig = require('konsta/config');

/** @type {import('tailwindcss').Config} */
export default konstaConfig({
    konsta: {
        colors: {
            // "primary" is the main app color, if not specified will be default to '#007aff'
            primary: '#e63c3c'
        }
    },
    content: ['./src/**/*.{html,js,svelte,ts}'], theme: {
        extend: {},
    },
    plugins: [

    ],
})