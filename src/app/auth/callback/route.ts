
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

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
