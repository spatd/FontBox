import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icons/icon.svg', 'icons/maskable-icon.svg'],
            manifest: {
                // APP NAME: change these values to rename the installed app.
                name: 'FontBox',
                short_name: 'FontBox',
                description: 'Private, on-device typography previews and PNG exports.',
                start_url: '/',
                display: 'standalone',
                orientation: 'portrait',
                // THEME COLORS: keep these aligned with src/styles.css.
                theme_color: '#101010',
                background_color: '#f5f5f3',
                icons: [
                    // APP ICONS: replace these placeholder SVGs in public/icons later.
                    { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
                    { src: '/icons/maskable-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
                ],
            },
            workbox: { navigateFallback: '/index.html' },
        }),
    ],
});
