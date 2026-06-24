import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        host: '127.0.0.1',
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom')) return 'react';
                        if (id.includes('maplibre-gl') || id.includes('react-map-gl')) return 'maplibre';
                        if (id.includes('framer-motion')) return 'framer';
                        return 'vendor';
                    }
                }
            }
        }
    },
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
});
