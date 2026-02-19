import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Trifoli',
        short_name: 'Trifoli',
        description: 'Your Personal AI Mentor & Portfolio Manager',
        start_url: '/guru',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#0EA5E9',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
