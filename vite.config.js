import { defineConfig } from 'vite';
import laravel            from 'laravel-vite-plugin';

export default defineConfig({
    server: {
        host : '127.0.0.1',   // lub '0.0.0.0', jeśli musisz udostępnić z zewnątrz
        port : 3000,
    },
    plugins: [
        laravel({
            // ładujemy **tylko** app.js; calendar.js przyjdzie przez import w app.js
            input  : [
                'resources/css/app.css',
                'resources/js/app.js',
            ],
            refresh: true,
        }),
    ],
});
