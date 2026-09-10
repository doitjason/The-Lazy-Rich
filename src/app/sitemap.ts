import { MetadataRoute } from 'next'
import { COLUMNS } from '@/data/columns'
import { RECOMMENDED_BOOKS, BOOKS_UPDATED_AT } from '@/data/books'
import { SITE_CONFIG } from '@/lib/constants'

/**
 * lastModified 는 빌드 시각이 아니라 그 페이지가 실제로 바뀐 날이어야 한다.
 *
 * new Date() 를 쓰면 배포할 때마다 63개 URL 전부가 방금 수정된 것으로 보고된다.
 * 손대지 않은 페이지까지 매번 갱신되었다고 알리면 신호가 아니라 잡음이 된다.
 */

/** 목록 성격의 페이지는 그 안에 담긴 콘텐츠가 바뀐 날을 따른다. */
function latestContentDate(): string {
    const dates = [
        ...COLUMNS.map((c) => c.updatedAt ?? c.publishedAt),
        BOOKS_UPDATED_AT,
    ]
    return dates.sort().at(-1)!
}

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = SITE_CONFIG.url
    const contentDate = latestContentDate()

    // Static routes
    //
    // 여기 넣는 경로는 색인되기를 바라는 페이지만이어야 한다.
    // /profile 과 /auth 는 로그인 뒤 개인 화면이라 noindex 이므로 제외한다.
    // (sitemap 에 올려 두고 noindex 를 거는 것은 서로 모순된 신호다)
    const routes: {
        path: string
        changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
        priority: number
        lastModified: string
    }[] = [
        // 홈은 칼럼과 도서 목록이므로 콘텐츠가 바뀐 날을 따른다.
        { path: '', changeFrequency: 'daily', priority: 1.0, lastModified: contentDate },
        { path: '/calc', changeFrequency: 'weekly', priority: 0.8, lastModified: '2026-09-10' },
        { path: '/mentor', changeFrequency: 'weekly', priority: 0.8, lastModified: '2026-09-10' },
        { path: '/portfolio', changeFrequency: 'weekly', priority: 0.7, lastModified: '2026-09-10' },
        { path: '/about', changeFrequency: 'monthly', priority: 0.7, lastModified: '2026-09-09' },
        { path: '/profile/about', changeFrequency: 'monthly', priority: 0.6, lastModified: '2026-03-18' },
        { path: '/privacy', changeFrequency: 'yearly', priority: 0.3, lastModified: '2026-09-09' },
        { path: '/terms', changeFrequency: 'yearly', priority: 0.3, lastModified: '2026-03-18' },
    ]

    const staticRoutes = routes.map(({ path, changeFrequency, priority, lastModified }) => ({
        url: `${baseUrl}${path}`,
        lastModified: new Date(lastModified),
        changeFrequency,
        priority,
    }))

    // Dynamic routes for Columns
    const columnRoutes = COLUMNS.map((column) => ({
        url: `${baseUrl}/columns/${column.id}`,
        lastModified: new Date(column.updatedAt ?? column.publishedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }))

    // Dynamic routes for Books
    const bookRoutes = RECOMMENDED_BOOKS.map((book) => ({
        url: `${baseUrl}/books/${book.id}`,
        lastModified: new Date(BOOKS_UPDATED_AT),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }))

    return [...staticRoutes, ...columnRoutes, ...bookRoutes]
}
