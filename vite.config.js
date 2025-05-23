import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    server: {
        host: '127.0.0.1', // lub '0.0.0.0' dla zewnętrznego dostępu
        port: 3000,         // zmień port z 5173 na np. 3000
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js', 'resources/js/calendar.js'],
            refresh: true,
        }),
    ],
    resolve: {
        alias: {
            'alpinejs': require.resolve('alpinejs'),
        }
    }
});