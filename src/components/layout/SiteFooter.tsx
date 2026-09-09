import Link from "next/link";

/**
 * SiteFooter — 모든 페이지 하단의 정책 링크 영역.
 *
 * 이 컴포넌트를 만들기 전까지 개인정보 처리방침과 이용약관으로 가는 링크는
 * /profile 안의 설정 화면에만 있었다. /profile 은 로그인 뒤 개인 화면이라
 * 색인에서 제외한 경로이기도 해서, 사실상 URL 을 직접 입력해야만 닿을 수
 * 있는 상태였다.
 *
 * 광고 심사와 제휴 표시 의무 양쪽에서 이 두 페이지는 어느 화면에서든
 * 한 번에 닿을 수 있어야 한다. 그래서 레이아웃에 상시 노출한다.
 *
 * 제휴 고지를 여기에도 둔 이유는 도서 상세 페이지 상단의 고지를 대체하기
 * 위해서가 아니다. 그 페이지의 고지는 그대로 두고, 사이트 전체에 제휴가
 * 포함된다는 사실을 어느 경로로 들어와도 알 수 있게 하려는 것이다.
 */
export function SiteFooter() {
    return (
        <footer className="mt-16 border-t border-gray-200 dark:border-white/10 px-5 py-6 max-w-md mx-auto">
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link
                    href="/about"
                    className="text-[12px] font-bold text-gray-600 dark:text-white/60 hover:underline underline-offset-4"
                >
                    에디터 소개
                </Link>
                <Link
                    href="/privacy"
                    className="text-[12px] font-bold text-gray-600 dark:text-white/60 hover:underline underline-offset-4"
                >
                    개인정보 처리방침
                </Link>
                <Link
                    href="/terms"
                    className="text-[12px] font-bold text-gray-600 dark:text-white/60 hover:underline underline-offset-4"
                >
                    이용약관
                </Link>
            </nav>

            <p className="mt-4 text-[11.5px] leading-relaxed text-gray-500 dark:text-white/40 font-medium break-keep">
                본 사이트의 콘텐츠는 정보 제공과 교육 목적으로 작성되며, 특정 종목이나
                금융 상품의 매수·매도를 권유하지 않습니다. 투자 판단과 그 결과에 대한
                책임은 투자자 본인에게 있습니다.
            </p>

            <p className="mt-2 text-[11.5px] leading-relaxed text-gray-500 dark:text-white/40 font-medium break-keep">
                추천 도서 페이지에는 쿠팡 파트너스 제휴 링크가 포함되어 있으며, 이를 통해
                일정액의 수수료를 제공받습니다. 수수료 여부가 도서 선정과 서술에 영향을
                주지 않습니다.
            </p>

            <p className="mt-4 text-[11px] text-gray-400 dark:text-white/25 font-medium">
                © The Lazy Rich
            </p>
        </footer>
    );
}
