
'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ErrorContent() {
    const searchParams = useSearchParams()

    // Get parameters from URL (query string or hash)
    // Note: hash params are not accessible via useSearchParams on server side, 
    // but this is a client component so we might be able to read them if converted to query params
    // or if the redirect logic puts them in query params.
    // However, Supabase redirects with error in query params usually for code flow.
    // If it's implicit flow it uses hash.

    const error = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    const errorDescription = searchParams.get('error_description')

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2 text-center px-4">
            <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>

            <div className="mb-6 p-4 bg-red-50 text-red-900 rounded-lg max-w-md w-full border border-red-200">
                {error || errorDescription ? (
                    <div className="space-y-2 text-left">
                        <p className="font-bold text-red-700">Error: {error || 'Unknown'}</p>
                        {errorCode && <p className="text-sm">Code: <span className="font-mono">{errorCode}</span></p>}
                        {errorDescription && (
                            <div className="mt-2 text-sm bg-white/50 p-2 rounded">
                                {errorDescription.replace(/\+/g, ' ')}
                            </div>
                        )}
                    </div>
                ) : (
                    <p>There was an error authenticating with the provider. Please check your browser console or server logs.</p>
                )}
            </div>

            <div className="text-sm text-gray-500 max-w-lg mb-8 text-left">
                <p className="mb-2 font-semibold">Troubleshooting Tips:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Check if <code>http://localhost:3000/auth/callback</code> is added to <strong>Redirect URLs</strong> in Supabase Dashboard.</li>
                    <li>Ensure you saved the changes in Supabase and Google Cloud Console.</li>
                    <li>Try clearing your browser cookies and trying again.</li>
                </ul>
            </div>

            <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Return to Home
            </Link>
        </div>
    )
}

export default function AuthCodeError() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading error details...</div>}>
            <ErrorContent />
        </Suspense>
    )
}
