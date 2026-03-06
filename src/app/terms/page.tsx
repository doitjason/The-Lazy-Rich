"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG } from "@/lib/constants";

export default function TermsPage() {
    return (
        <div className="max-w-md mx-auto relative bg-[#0b0c10] min-h-screen pb-24 sm:border-x sm:border-white/5 shadow-2xl overflow-hidden font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0b0c10]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center gap-3">
                <Link href="/profile">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/10">
                        <ChevronLeft className="h-5 w-5 text-white/70" />
                    </Button>
                </Link>
                <h1 className="text-sm font-bold text-white/90 flex-1">서비스 이용약관 전문</h1>
            </header>

            <main className="px-6 py-10 relative z-10">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-10"
                >
                    <div className="space-y-4">
                        <h2 className="text-lg font-black text-white tracking-tight border-b border-white/20 pb-2">서비스 이용약관</h2>
                        <p className="text-[11px] text-white/40 leading-relaxed font-mono">
                            본 약관은 2026년 3월 5일부터 시행됩니다.
                        </p>
                    </div>

                    <div className="space-y-8 text-[12px] text-white/60 leading-relaxed text-justify break-all font-light">
                        <div className="space-y-3">
                            <h3 className="font-bold text-white/90 text-[13px]">제1조 (목적)</h3>
                            <p>
                                본 이용약관(이하 '약관')은 The Lazy Rich(이하 '회사' 또는 '서비스')가 제공하는 웹사이트 및 애플리케이션 서비스(이하 '서비스')의 이용과 관련하여 회사와 이용자(이하 '회원') 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다. 회원은 본 서비스를 이용함으로써 본 약관 및 관련 지침에 동의한 것으로 간주됩니다.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-white/90 text-[13px]">제2조 (용어의 정의)</h3>
                            <p>
                                1. '서비스'란 유무선 장치와 관계없이 회사가 제공하는 AI 멘토링, 금융 계산기, 인사이트 등의 모든 서비스를 의미합니다.
                                <br />2. '회원'이란 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 자를 의미합니다.
                                <br />3. '콘텐츠'란 회사가 서비스 내에 게시한 문자, 정보, 이미지, 계산 결과, 그래프 등을 의미합니다.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-white/90 text-[13px]">제3조 (약관의 게시와 개정)</h3>
                            <p>
                                1. 회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면 또는 프로필 설정 화면 등에 게시합니다.
                                <br />2. 회사는 '약관의 규제에 관한 법률', '정보통신망 이용촉진 및 정보보호 등에 관한 법률' 등 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-white/90 text-[13px]">제4조 (계약의 해지 및 이용 제한)</h3>
                            <p>
                                회원은 언제든지 서비스 내 설정 또는 공지된 절차를 통해 이용계약 해지를 신청할 수 있으며, 회사는 관련 법령이 정하는 바에 따라 이를 지체 없이 처리합니다. 타인의 계정 도용, 시스템 해킹 시도 등 부적절한 행위가 적발될 시 회사는 즉각적 이용 제한 조치를 취할 수 있습니다.
                            </p>
                        </div>

                        <div className="space-y-3 p-5 bg-white/[0.03] border border-white/5 shadow-inner">
                            <h3 className="font-bold text-white/90 text-[14px]">제5조 (매우 중요한 투자 면책 및 법적 조항)</h3>
                            <p className="text-white/80 font-bold whitespace-pre-wrap leading-relaxed">
                                1. 회사가 제공하는 모든 정보(AI 멘토 응답, 복리/적립식 계산 결과, 포트폴리오 분석 리포트 등)는 단순 학습 및 정보 전달 목적이며, 어떠한 경우에도 투자 권유나 종목 추천으로 해석될 수 없습니다.
                                <br />2. 모든 투자 결정에 따른 결과와 법적 책임은 전적으로 회원 본인에게 있으며, 회사와 운영지는 이용자의 투자 손실이나 결과에 대해 민·형사상 어떠한 책임도 지지 않습니다.
                                <br />3. 서비스 내 제공되는 과거 데이터 및 수익률 지표는 미래 수익을 보장하지 않으며, 데이터 수집 시점에 따라 실제 시장 지표와 다소 차이가 발생할 수 있습니다.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-white/90 text-[13px]">제6조 (쿠팡 파트너스 및 수익 구조 고지)</h3>
                            <p>
                                회사는 인사이트 탭의 도서 추천 등 서비스 내에 상품 구매 링크를 포함할 수 있습니다. 회원은 해당 링크를 통해 구매가 이루어질 경우 운영자가 쿠팡 파트너스 등 광고수수료 활동의 일환으로 일정액의 수수료를 제공받을 수 있음을 인지하고 동의합니다. 이는 사이트 운영 유지 및 품질 개선의 재원으로 활용됩니다.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-white/90 text-[13px]">제7조 (서비스의 변경 및 중단)</h3>
                            <p>
                                회사는 상당한 이유가 있는 경우 서비스 운영상, 기술상의 필요에 따라 제공하고 있는 전부 또는 일부 서비스를 변경하거나 중단할 수 있습니다. 이에 대하여 회사는 고의 또는 중대한 과실이 없는 한 회원에게 어떠한 보상 책임도 지지 않습니다.
                            </p>
                        </div>

                        <div className="space-y-3 border-t border-white/10 pt-6">
                            <h3 className="font-bold text-white/90 text-[13px]">제8조 (준거법 및 재판관할)</h3>
                            <p>
                                1. 회사와 회원 간 발생한 분쟁에 대하여는 대한민국 법을 준거법으로 합니다.
                                <br />2. 회사와 회원 간 발생한 분쟁에 관한 소송은 회사의 본사 소재지를 관할하는 법원을 전용 관할법원으로 합니다.
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
