"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/constants";

export default function PrivacyPage() {
    return (
        <div className="max-w-md mx-auto relative bg-[#0b0c10] min-h-screen pb-24 sm:border-x sm:border-white/5 shadow-2xl overflow-hidden font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0b0c10]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center gap-3">
                <Link href="/profile">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/10">
                        <ChevronLeft className="h-5 w-5 text-white/70" />
                    </Button>
                </Link>
                <h1 className="text-sm font-bold text-white/90 flex-1">개인정보 처리방침 전문</h1>
            </header>

            <main className="px-6 py-10 relative z-10">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-10"
                >
                    <div className="space-y-4">
                        <h2 className="text-lg font-black text-white tracking-tight border-b border-white/20 pb-2">개인정보 처리방침</h2>
                        <p className="text-[11px] text-white/40 leading-relaxed font-mono">
                            본 방침은 2026년 3월 5일부터 시행됩니다.
                        </p>
                    </div>

                    <div className="space-y-8 text-[12px] text-white/60 leading-relaxed text-justify break-all font-light">
                        <div className="space-y-3">
                            <h3 className="font-bold text-white/90 text-[13px]">제1조 (목적)</h3>
                            <p>
                                The Lazy Rich(이하 '회사' 또는 '서비스')는 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다. 본 방침은 관계 법령 및 지침에 따라 수립되었으며, 서비스 기획부터 운영 전반에 걸쳐 개인정보보호법 등 관련 법규를 엄격히 준수합니다.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-white/90 text-[13px]">제2조 (개인정보의 처리 항목 및 수집 방법)</h3>
                            <p>
                                1. 회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.
                                <br />- 수집항목: 이메일 주소, 비밀번호(암호화), 소셜 로그인 정보(Google ID, 이름, 프로필 사진), 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보, 기기 정보(OS, 브라우저 종류).
                                <br />2. 개인정보 수집방법: 홈페이지(회원가입, 게시판 등), 생성정보 수집 툴을 통한 자동 수집.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-white/90 text-[13px]">제3조 (개인정보의 처리 및 보유 기간)</h3>
                            <p>
                                1. 회사는 이용자로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 또는 법령에 따른 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
                                <br />2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
                                <br />- 홈페이지 회원 가입 및 관리: 홈페이지 탈퇴 시까지. 다만, 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지.
                                <br />- 서비스 제공: 서비스 공급 완료 및 요금 결제·정산 확인 시까지.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-white/90 text-[13px]">제4조 (개인정보의 제3자 제공 및 국외 이전)</h3>
                            <p>
                                1. 회사는 이용자의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 이용자의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
                                <br />2. 회사는 원활한 서비스 제공 및 타겟팅 광고 제안을 위해 다음의 외부 기관에 정보를 제공 및 위탁할 수 있으며, 서비스 이용 시점에 해외 서버로 데이터가 전송될 수 있습니다:
                                <br />- Google (AdSense, Analytics): 맞춤형 광고 게재 및 서비스 이용 통계 분석.
                                <br />- Meta Platforms, Inc. (Facebook Pixel): 광고 성과 측정, 방문 기록 기반 맞춤형 오디언스 생성 및 리타겟팅 광고 전송.
                                <br />- PostHog, Inc.: 사용성 분석 및 제품 개선을 위한 행동 데이터 처리.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-white/90 text-[13px]">제5조 (개인정보처리 위탁)</h3>
                            <p>
                                회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
                                <br />- 위탁 받는 자 (수탁자): Supabase, Inc. (데이터베이스 관리 및 인증 서비스)
                                <br />- 위탁하는 업무의 내용: 회원 데이터 보관 및 인증 시스템 운영 관리.
                            </p>
                        </div>

                        <div className="space-y-3 bg-white/[0.03] p-4 rounded-sm border border-white/5">
                            <h3 className="font-bold text-white/90 text-[13px]">제6조 (광고 쿠키 및 웹 비컨 기술 고지)</h3>
                            <p className="text-white/80">
                                1. 본 서비스는 제3자 광고 사업자(Google, Meta 등)가 제공하는 맞춤형 광고 기술을 사용합니다.
                                <br />2. <strong className="font-bold text-white">Google AdSense</strong>: Google을 포함한 제3자 공급업체는 쿠키를 사용하여 이용자의 본 사이트 및 다른 사이트 방문 기록을 바탕으로 맞춤 광고를 게재합니다. 이용자는 Google의 광고 설정에서 이를 해제할 수 있습니다.
                                <br />3. <strong className="font-bold text-white">Meta Pixel (Facebook Pixel)</strong>: 본 서비스는 Meta(Facebook)가 제공하는 픽셀 기술을 사용하여 이용자의 서비스 이용 행태(페이지 뷰, 클릭 등)를 수집합니다. 수집된 정보는 Meta의 서버로 전송되어 광고 최적화 및 맞춤 타겟팅 광고 게재를 위해 활용됩니다. 이용자는 Facebook 광고 설정을 통해 이를 관리할 수 있습니다.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-white/90 text-[13px]">제7조 (이용자 및 법정대리인의 권리와 그 행사방법)</h3>
                            <p>
                                이용자는 개인정보주체로서 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다. 회사는 이에 대해 지체 없이 조치하겠습니다.
                            </p>
                        </div>

                        <div className="space-y-3 border-t border-white/10 pt-6">
                            <h3 className="font-bold text-white/90 text-[13px]">제8조 (개인정보 보호책임자)</h3>
                            <p>
                                이용자는 회사의 서비스(또는 사업)를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있습니다.
                                <br />- 성명: 황병진 (개인정보 보호책임자)
                                <br />- 이메일: {SITE_CONFIG.supportEmail}
                            </p>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-white/5 pb-10">
                        <p className="text-[10px] text-white/20 text-center leading-relaxed font-mono">
                            COPYRIGHT © The Lazy Rich ALL RIGHTS RESERVED.
                        </p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
