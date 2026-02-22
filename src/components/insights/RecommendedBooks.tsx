"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Info, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const RECOMMENDED_BOOKS = [
    {
        id: "psychology-of-money",
        title: "돈의 심리학 (The Psychology of Money)",
        author: "모건 하우절 (Morgan Housel)",
        tag: "Best Seller",
        tagColor: "text-emerald-500",
        bgLight: "bg-emerald-500/10",
        description: "돈에 대한 태도와 심리가 부의 축적에 어떤 영향을 주는지 탐구하며, 시대를 초월한 부의 원칙을 설명합니다. 당신의 포트폴리오 멘탈리티를 잡아줄 필독서.",
        longDescription: "우리는 종종 투자를 수학이나 데이터의 영역으로 생각합니다. 하지만 모건 하우절은 '투자는 수학이 아니라 심리학이다'라고 단언합니다. 이 책은 뛰어난 경제 지식보다 돈을 대하는 태도와 감정 통제력이 장기적인 부의 형성에 얼마나 중요한지를 20가지 흥미로운 스토리를 통해 풀어냅니다. 시장 변동성에 흔들리지 않고 평생 투자를 이어가야 할 우리들에게 완벽한 마인드셋 지침서가 되어 줍니다.",
        imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQqg1qq0GrrH5463QyWT4Sde_CwUNrzvHT5C-wCKF2PcMIEDVeV4-TavKW2v9KnxeBueVEtSu3yvaDgGA1pPD4oZWXYjeCkVbBr74lzJ62i57fUM7f955kyUM2CrwYefsZ1N47RJm3Osk_g90HC6pTAI0WGV-pj2bOZQ03QV-vSIHiXKrwjObMQh1oxCtgMJKCmGeCHKR7t3NuGXge40SuXtVRuKLu_M-MRqTyvo8b-2nmmgKtmHOdmhCCbDoljIOyhdLZC5mXsIw",
        link: "https://coupang.com", // Example affiliate link
    },
    {
        id: "intelligent-investor",
        title: "현명한 투자자 (The Intelligent Investor)",
        author: "벤저민 그레이엄 (Benjamin Graham)",
        tag: "Value Classic",
        tagColor: "text-amber-500",
        bgLight: "bg-amber-500/10",
        description: "워런 버핏이 가장 위대한 투자서로 꼽은 가치 투자의 바이블. 시장의 변동성을 이겨내는 지혜와 안전 마진의 중요성을 강조합니다.",
        longDescription: "워런 버핏이 '지금까지 쓰인 투자서 중 단연 최고'라고 극찬한 이 책은, 투기와 투자의 명확한 차이를 규명하고 가치투자 시대의 막을 열었습니다. '미스터 마켓(Mr. Market)'이라는 비유를 통해 시장의 비합리적인 변동성에 부화뇌동하지 않는 법과, 잃지 않는 투자를 위한 '안전 마진(Margin of Safety)'의 개념을 깊이 있게 다룹니다. 장기 투자의 근본을 확립하고 싶은 분들께 가장 추천하는 고전 중의 고전입니다.",
        imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBwou5Dc9ZA2r1Ce8z_j3TZOmvtZngqBrjubHI0OaoF4ly4WfKQ5EtRf9Xf7kY3zh9XzY30h83FmUBJDz6yeP8PNSzWgXD3DFUdRbTYbs3TG_6ezqafUDEkOI8bfHR8vILgyM97pM7i7bGEormOnjl2cYrNTzlQzPekjgYwu0usqv1LQy5vB612-pCWuUn0RqGqY-DQUWcNPecIdksdPwq8GTaux2DYemjP2Fv3OJpWXPFUxPBEzmrWJY8GrvSfRRcWcTsvF3PHG3Y",
        link: "https://coupang.com",
    },
    {
        id: "principles",
        title: "원칙 (Principles)",
        author: "레이 달리오 (Ray Dalio)",
        tag: "Strategy",
        tagColor: "text-blue-500",
        bgLight: "bg-blue-500/10",
        description: "세계 최대 헤지펀드 설립자가 공개하는 투자와 삶의 원칙. 투명하고 극단적인 현실 수용을 통한 거시경제적 투자 인사이트.",
        longDescription: "'올웨더 포트폴리오(사계절 포트폴리오)'의 창시자이자 브리지워터 어소시에이츠의 수장인 레이 달리오가 인생과 시장에서 승리하기 위해 철저하게 세운 원칙들을 담았습니다. 극단적인 투명성과 철저한 피드백 루프를 통해 시장의 불확실성을 기회로 바꾸는 그의 집요한 마인드셋을 엿볼 수 있습니다. 투자 전략뿐만 아니라 거대한 경제 사이클을 어떻게 대해야 할지를 배우기 좋습니다.",
        imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQ_6JkekyJoXXUrKAoQJE45i5nG2AIeOxnXq83fz6Lvuv4O7SeNh5MwP3x1RxKsEL3yT0G8l-nO679QTafElKyV93eFfzd7zFH18zbZBi3Ubimt0-iddAY6v1orR3G3X8JAKl_7HKiWIcvcCaH98_qpi5s-b5ajAVt1tYDkey6GOlxdsafGSmRfA43bATtnAih7re4_WBTvkeWWn_uITFzeAidculnMf4DML_mhto1RdN8_xNS7lTErnosRRM4L6EZ-Nwr1H0YuDM",
        link: "https://coupang.com",
    },
    {
        id: "little-book",
        title: "모든 주식을 소유하라",
        author: "존 보글 (John C. Bogle)",
        tag: "Financial Freedom",
        tagColor: "text-purple-500",
        bgLight: "bg-purple-500/10",
        description: "인덱스 펀드의 창시자가 말하는 비용 효율적인 투자 전략. 승자의 게임을 영위하는 장기적 관점의 시장 참여 방법을 다룹니다.",
        longDescription: "주식 시장의 모든 회사를 소유하는 가장 똑똑하고 강력한 방법. 인덱스 펀드의 아버지 '존 보글'이 펀드 매니저를 이기려 들지 말고 시장 선율에 몸을 맡기라고 조언합니다. 월가의 복잡한 상품 구조와 비싼 수수료의 함정을 피하고, 소박하지만 훌륭한 성과를 거두게 해줄 S&P 500 ETF 투자 철학이 가득합니다. 가장 평범한 투자자가 전문가를 이길 수 있는 최고의 무기입니다.",
        imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBmfn1kFN6Fc5jzMRHWMlRo_CrHJkZ_r04kg2pUYMGD145l_N5iVBEXvSRw5EJqorRP_9bartQH15LvFx8v9APY-TrgeXkBpje6XU8D63LvCNnKUJj27Gqj8SIOw1RqDaTbagCYM4zefN_RfZj-9FlIVofp1sF8U3fARn-96-SyDgPPlIxnGF7PmUmZioSSRgmnkGiBiGgB1m995Lim0civi1U1ycVy2snUkOO4Y5mPs7Gyo4NDxCwnFhxjHXZgo3-g-l96pwStw0s",
        link: "https://coupang.com",
    }
];

export function RecommendedBooks() {
    const [selectedBook, setSelectedBook] = useState<typeof RECOMMENDED_BOOKS[0] | null>(null);

    return (
        <>
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {RECOMMENDED_BOOKS.map((book, idx) => (
                    <motion.div
                        key={book.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                        onClick={() => setSelectedBook(book)}
                        className="bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/10 rounded-2xl p-4 flex gap-4 shadow-sm relative overflow-hidden group cursor-pointer hover:bg-white/10 transition-colors"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="w-24 sm:w-28 flex-shrink-0 relative z-10">
                            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-xl bg-muted/20 border border-white/10 group-hover:shadow-2xl transition-shadow">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    alt={book.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    src={book.imgUrl}
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between flex-grow py-1 relative z-10">
                            <div>
                                <span className={`text-[10px] sm:text-xs font-extrabold uppercase tracking-widest mb-1.5 inline-block px-2 py-0.5 rounded-full ${book.tagColor} ${book.bgLight}`}>
                                    {book.tag}
                                </span>
                                <h2 className="text-base sm:text-lg font-bold leading-tight line-clamp-2 text-foreground mt-1">
                                    {book.title}
                                </h2>
                                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 font-medium">
                                    {book.author}
                                </p>
                                <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-2 line-clamp-3 leading-relaxed break-keep">
                                    {book.description}
                                </p>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                    리뷰 보기 <span className="text-[10px]">→</span>
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Book Details Bottom Sheet */}
            <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
                <DialogContent className="sm:max-w-[425px] bg-[#f8fafc] dark:bg-[#1a1c23] backdrop-blur-3xl border-white/20 dark:border-white/10 p-0 overflow-hidden fixed bottom-0 top-auto translate-y-0 translate-x-[-50%] sm:top-[50%] sm:-translate-y-1/2 rounded-t-3xl rounded-b-none sm:rounded-2xl z-50 flex flex-col max-h-[90vh]">
                    {selectedBook && (
                        <>
                            {/* Affiliate Notice Banner - Anchored to the very top */}
                            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-3 flex items-start gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <p className="leading-relaxed opacity-90 break-keep">
                                    이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
                                </p>
                            </div>

                            {/* Scrollable Content */}
                            <div className="overflow-y-auto p-6 pb-[100px] flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-full relative">
                                        <div className="flex gap-5">
                                            <div className="w-28 flex-shrink-0 shadow-2xl rounded-lg overflow-hidden border border-white/10">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    alt={selectedBook.title}
                                                    src={selectedBook.imgUrl}
                                                    className="w-full h-auto object-cover aspect-[2/3]"
                                                />
                                            </div>
                                            <div className="flex flex-col pt-1">
                                                <span className={`text-[10px] font-extrabold uppercase tracking-widest mb-1.5 inline-block w-max px-2 py-0.5 rounded-full ${selectedBook.tagColor} ${selectedBook.bgLight}`}>
                                                    {selectedBook.tag}
                                                </span>
                                                <h2 className="text-xl font-bold leading-tight text-foreground">
                                                    {selectedBook.title}
                                                </h2>
                                                <p className="text-sm text-muted-foreground mt-2 font-medium">
                                                    {selectedBook.author}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-extrabold text-sm text-foreground/90 flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block" />
                                        에디터 추천 리뷰
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-loose break-keep">
                                        {selectedBook.longDescription}
                                    </p>
                                </div>
                            </div>

                            {/* Sticky Bottom CTA */}
                            <div className="absolute w-full bottom-0 p-4 pt-6 bg-gradient-to-t from-[#f8fafc] dark:from-[#1a1c23] via-[#f8fafc]/90 dark:via-[#1a1c23]/90 to-transparent">
                                <a
                                    href={selectedBook.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/25"
                                >
                                    <span className="text-sm">책 구매하기</span>
                                    <ShoppingCart className="w-4 h-4 ml-1" />
                                </a>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
