
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Allowed redirect path prefixes (prevent open redirect attacks)
const ALLOWED_REDIRECT_PREFIXES = [
    '/portfolio',
    '/mentor',
    '/columns',
    '/books',
    '/profile',
    '/calc',
    '/about',
    '/privacy',
    '/terms',
];

function getSafeRedirectPath(next: string | null): string {
    const defaultPath = '/portfolio';
    if (!next) return defaultPath;

    // Block: protocol-relative URLs (//evil.com), absolute URLs, data: URLs
    if (next.startsWith('//') || next.includes('://') || next.startsWith('data:')) {
        return defaultPath;
    }

    // Ensure it starts with /
    if (!next.startsWith('/')) {
        return defaultPath;
    }

    // Check against allowlist
    const isAllowed = ALLOWED_REDIRECT_PREFIXES.some(prefix => next.startsWith(prefix));
    return isAllowed ? next : defaultPath;
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = getSafeRedirectPath(searchParams.get('next'))

    if (code) {
        const supabase = await createClient()

        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }

        console.error('Auth Code Exchange Error:', error)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}&error_description=${encodeURIComponent(JSON.stringify(error))}`)
    }

    // return the user to an error page with instructions
    // Pass query params for error details if available, or a generic error if not
    const error = searchParams.get('error')
    const error_code = searchParams.get('error_code')
    const error_description = searchParams.get('error_description')

    let redirectUrl = `${origin}/auth/auth-code-error?`
    if (error) redirectUrl += `error=${encodeURIComponent(error)}&`
    if (error_code) redirectUrl += `error_code=${encodeURIComponent(error_code)}&`
    if (error_description) redirectUrl += `error_description=${encodeURIComponent(error_description)}&`

    return NextResponse.redirect(redirectUrl)
}
