import { MetadataRoute } from 'next'
import { COLUMNS } from '@/data/columns'
import { RECOMMENDED_BOOKS } from '@/data/books'
import { SITE_CONFIG } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = SITE_CONFIG.url

    // Static routes
    const routes = [
        '',
        '/calc',
        '/portfolio',
        '',
        '/profile',
        '/privacy',
        '/terms',
        '/about',
        '/profile/about',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1.0 : 0.8,
    }))

    // Dynamic routes for Columns
    const columnRoutes = COLUMNS.map((column) => ({
        url: `${baseUrl}/columns/${column.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }))

    // Dynamic routes for Books
    const bookRoutes = RECOMMENDED_BOOKS.map((book) => ({
        url: `${baseUrl}/books/${book.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }))

    return [...routes, ...columnRoutes, ...bookRoutes]
}
