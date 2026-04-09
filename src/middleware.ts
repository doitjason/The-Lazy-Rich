import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
    // 1. Supabase Session Auto-Refresh
    // 이 함수 내부에서 쿠키를 갱신하고 응답에 반영합니다.
    const response = await updateSession(request);

    // 2. 추가적인 보호 라우트 처리 로직이 필요하다면 여기에 추가
    // (현재는 updateSession 내부에서 인증 실패 시에 대한 기본적인 
    // 리다이렉션을 처리하도록 구성되어 있다면 그것을 따름)

    return response;
}

// Ensure the middleware is only called for relevant paths.
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
