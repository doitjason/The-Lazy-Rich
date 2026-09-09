import { Metadata } from "next";

/**
 * /profile 은 로그인한 사용자의 계정 화면이다. 크롤러에게는 보여줄 내용이
 * 없으므로 색인에서 뺀다. 로그인 벽 뒤의 빈 페이지가 색인되면 사이트 품질
 * 평가에 도움이 되지 않는다.
 *
 * 하위 경로인 /profile/about 은 공개용 서비스 소개 페이지라서
 * 자체 layout 에서 robots 를 다시 열어 준다.
 */
export const metadata: Metadata = {
    // template 을 다시 선언하지 않으면 하위 세그먼트(/profile/about)가
    // 루트의 "%s | The Lazy Rich" 를 잃고 제목이 사이트명 없이 나온다.
    title: {
        default: "내 정보",
        template: "%s | The Lazy Rich",
    },
    description: "계정 설정과 이용 내역을 관리합니다.",
    robots: { index: false, follow: true },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
