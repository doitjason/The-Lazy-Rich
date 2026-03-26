import { LucideIcon, TrendingUp, TrendingDown, DollarSign, Wallet, PieChart, Activity } from "lucide-react";

// --- Types ---
// NOTE: Portfolio data (PORTFOLIO_DATA) has been removed.
// Real portfolio data is now stored in Supabase and accessed via usePortfolioStore.

export interface NewsItem {
    id: string;
    source: string;
    time: string;
    title: string;
    sentiment: "positive" | "negative" | "neutral";
    imageUrl?: string;
}

export interface GuruPersona {
    id: string;
    name: string;
    tag: string;
    description: string;
    color: string;
    avatarInitials: string;
    introMessage: string;
}

export interface ChatMessage {
    id: string;
    role: "user" | "ai";
    content: string;
    timestamp: Date;
}

// --- Mock Data ---

export const NEWS_DATA: NewsItem[] = [
    {
        id: "1",
        source: "Bloomberg",
        time: "2시간 전",
        title: "연준(Fed), 오는 9월 회의에서 기준금리 인하 가능성 시사",
        sentiment: "positive",
    },
    {
        id: "2",
        source: "Reuters",
        time: "4시간 전",
        title: "인플레이션 지속에 소비자 지출 3개월 연속 감소",
        sentiment: "negative",
    },
    {
        id: "3",
        source: "CNBC",
        time: "5시간 전",
        title: "AI 낙관론 및 역대급 실적 발표로 기술주 급등",
        sentiment: "positive",
    },
    {
        id: "4",
        source: "App Insider",
        time: "8시간 전",
        title: "프리미엄 회원을 위한 새로운 포트폴리오 관리 도구 출시",
        sentiment: "neutral",
    },
    {
        id: "5",
        source: "WSJ",
        time: "10시간 전",
        title: "강력한 고용 지표에 힘입어 전 세계 증시 반등",
        sentiment: "positive",
    },
];

export const GURU_PERSONAS: GuruPersona[] = [
    {
        id: "buffett",
        name: "워렌 버핏",
        tag: "가치 투자",
        description: "내재 가치와 장기적인 경제적 해자에 집중합니다.",
        color: "bg-blue-500",
        avatarInitials: "WB",
        introMessage: "제1원칙: 절대로 돈을 잃지 마라. 제2원칙: 제1원칙을 절대 잊지 마라. 오늘은 어떤 기업을 분석하고 싶으신가요?",
    },
    {
        id: "bogle",
        name: "존 보글",
        tag: "인덱스 펀드",
        description: "대중을 위한 저비용 패시브 투자를 지향합니다.",
        color: "bg-green-500",
        avatarInitials: "JB",
        introMessage: "건초 더미에서 바늘을 찾지 마세요. 그냥 건초 더미를 사세요! 자산 배분에 대해 고민이 있으신가요?",
    },
    {
        id: "graham",
        name: "벤자민 그레이엄",
        tag: "안전 마진",
        description: "가치 투자의 아버지이자 안전 마진의 창시자입니다.",
        color: "bg-yellow-500",
        avatarInitials: "BG",
        introMessage: "철저한 분석 하에 원금의 안전과 만족할 만한 수익을 약속하는 것만이 투자입니다. 당신은 투기를 하고 있나요, 투자를 하고 있나요?",
    },
    {
        id: "lynch",
        name: "피터 린치",
        tag: "성장주 투자",
        description: "당신이 잘 알고 이해하는 기업에 투자하세요.",
        color: "bg-purple-500",
        avatarInitials: "PL",
        introMessage: "모든 주식 뒤에는 기업이 있습니다. 그 기업이 무엇을 하고 있는지 알아보세요. 최근 눈여겨본 우리 주변의 기업이 있나요?",
    },
];
