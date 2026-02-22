"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GuruSelector } from "@/components/guru/GuruSelector";
import { ChatInterface } from "@/components/guru/ChatInterface";
import { GuruPersona, getGuruById } from "@/lib/guru-personas";
import { useAuth } from "@/contexts/AuthContext";
import { BrandStoryDialog } from "@/components/layout/BrandStoryDialog";

function GuruPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [selectedGuru, setSelectedGuru] = useState<GuruPersona | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
    const { user } = useAuth();

    // Create a new chat session when guru is selected
    const handleGuruSelect = async (guru: GuruPersona) => {
        setSelectedGuru(guru);

        if (user) {
            try {
                const response = await fetch("/api/chat/sessions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user.id,
                        personaId: guru.id,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setSessionId(data.session?.id || null);
                }
            } catch (error) {
                console.error("Failed to create session:", error);
            }
        }
    };

    // Handle auto-selection based on URL query param
    useEffect(() => {
        const action = searchParams.get("action");
        const personaId = searchParams.get("persona");

        if (action === "analyze_portfolio" && personaId) {
            const autoGuru = getGuruById(personaId);
            if (autoGuru && !selectedGuru) {  // only auto-select if a guru isn't already active
                // Clean the URL so refreshing doesn't keep triggering it
                router.replace("/guru", { scroll: false });

                setInitialMessage("내 포트폴리오를 기반으로 현재 자산 상태를 상세히 분석해줘");
                handleGuruSelect(autoGuru);
            }
        }
    }, [searchParams, selectedGuru, router]);

    // Scroll to top when view changes
    useEffect(() => {
        // Ensure scroll reset happens after the DOM has likely updated for the new view
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
            document.body.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }, 0);
        return () => clearTimeout(timer);
    }, [selectedGuru]);

    // Reset session when going back
    const handleBack = () => {
        setSelectedGuru(null);
        setSessionId(null);
        setInitialMessage(undefined);
    };

    return (
        <div className={selectedGuru ? "flex flex-col h-[calc(100dvh-85px)] p-4 max-w-md mx-auto" : "flex min-h-screen flex-col p-4 max-w-md mx-auto pb-24"}>
            {selectedGuru ? (
                <ChatInterface
                    guru={selectedGuru}
                    onBack={handleBack}
                    userId={user?.id}
                    sessionId={sessionId || undefined}
                    initialMessage={initialMessage}
                />
            ) : (
                <>
                    <header className="pt-8 pb-6">
                        <h1 className="text-3xl font-bold tracking-tight">AI Mentor</h1>
                        <p className="text-muted-foreground">당신만의 AI Mentor와 대화하세요.</p>
                    </header>
                    <GuruSelector onSelect={handleGuruSelect} />
                </>
            )}
        </div>
    );
}

export default function GuruPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading AI Mentor...</div>}>
            <GuruPageContent />
        </Suspense>
    );
}
