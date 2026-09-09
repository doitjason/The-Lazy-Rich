import Link from "next/link";

/**
 * AuthorBox — 칼럼 하단 저자/편집 정보 블록.
 *
 * YMYL(금융) 콘텐츠는 "누가 쓰고 누가 책임지는가"가 해당 페이지에서 바로
 * 확인되어야 평가에 유리하다. 소개 페이지로 들어가야만 알 수 있으면 약하다.
 *
 * 여기에 표시하는 내용은 전부 /about 에 이미 공개된 편집 기준에서 가져온다.
 * 검증되지 않은 경력이나 자격을 적지 않는다. 금융 콘텐츠에서 근거 없는
 * 전문성 주장은 신뢰를 높이는 것이 아니라 깎는다.
 */

interface AuthorBoxProps {
    author: string;
    publishedAt: string;
    /** 저자 배경 한두 줄. 사실인 내용만 넣는다. 비우면 표시하지 않는다. */
    bio?: string;
}

/**
 * 기본 약력. 자격증이나 업계 경력을 주장하지 않는다.
 *
 * 금융 콘텐츠에서 비전문가가 전문가인 척하는 것이 가장 큰 감점 요인이다.
 * 반대로 "전문가가 아니다"를 먼저 밝히고 근거를 붙이는 글은 감점 대상이
 * 아니다. 아래 문장은 전부 사실이어야 하며, 사실이 바뀌면 같이 고친다.
 */
export const EDITOR_BIO =
    "금융업에 종사하지 않는 개인 투자자입니다. 제 돈으로 인덱스 중심의 장기투자를 이어가면서, 공개된 통계와 법령 원문을 직접 확인해 정리합니다.";

const EDITORIAL_PRINCIPLES = [
    "데이터와 통계는 공신력 있는 출처를 기반으로 합니다.",
    "특정 종목이나 금융 상품의 매수·매도를 추천하지 않습니다.",
    "광고와 편집 콘텐츠를 구분하며, 제휴가 포함된 경우 해당 페이지에 고지합니다.",
    "오류가 발견되면 확인 즉시 정정합니다.",
];

export function AuthorBox({ author, publishedAt, bio = EDITOR_BIO }: AuthorBoxProps) {
    return (
        <section
            aria-label="작성자 정보"
            className="border border-gray-200 dark:border-white/10 rounded-3xl p-5 bg-gray-50/60 dark:bg-white/[0.03]"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg flex-shrink-0">
                    ✍️
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-black text-gray-900 dark:text-white tracking-tight">
                        {author}
                    </p>
                    {bio && (
                        <p className="text-[12.5px] text-gray-500 dark:text-white/50 leading-relaxed font-medium mt-1 break-keep">
                            {bio}
                        </p>
                    )}
                    <p className="text-[11px] text-gray-400 dark:text-white/30 font-medium mt-1">
                        {publishedAt} 작성
                    </p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                <p className="text-[11px] font-bold text-gray-500 dark:text-white/45 mb-2">
                    이 글의 편집 기준
                </p>
                <ul className="space-y-1.5">
                    {EDITORIAL_PRINCIPLES.map((line) => (
                        <li
                            key={line}
                            className="flex items-start gap-2 text-[11.5px] text-gray-500 dark:text-white/45 leading-relaxed font-medium break-keep"
                        >
                            <span className="w-1 h-1 rounded-full bg-emerald-500/50 mt-[7px] flex-shrink-0" />
                            <span className="flex-1">{line}</span>
                        </li>
                    ))}
                </ul>
                <Link
                    href="/about"
                    className="inline-block mt-3 text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4"
                >
                    에디터 소개와 문의처 보기 →
                </Link>
            </div>
        </section>
    );
}
