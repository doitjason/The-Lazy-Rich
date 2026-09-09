import { MetadataRoute } from 'next'
import { COLUMNS } from '@/data/columns'
import { RECOMMENDED_BOOKS } from '@/data/books'
import { SITE_CONFIG } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = SITE_CONFIG.url

    // Static routes
    //
    // 여기 넣는 경로는 색인되기를 바라는 페이지만이어야 한다.
    // /profile 과 /auth 는 로그인 뒤 개인 화면이라 noindex 이므로 제외한다.
    // (sitemap 에 올려 두고 noindex 를 거는 것은 서로 모순된 신호다)
    const routes: { path: string; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'; priority: number }[] = [
        { path: '', changeFrequency: 'daily', priority: 1.0 },
        { path: '/calc', changeFrequency: 'weekly', priority: 0.8 },
        { path: '/mentor', changeFrequency: 'weekly', priority: 0.8 },
        { path: '/portfolio', changeFrequency: 'weekly', priority: 0.7 },
        { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
        { path: '/profile/about', changeFrequency: 'monthly', priority: 0.6 },
        { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
        { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    ]

    const staticRoutes = routes.map(({ path, changeFrequency, priority }) => ({
        url: `${baseUrl}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
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

    return [...staticRoutes, ...columnRoutes, ...bookRoutes]
}
