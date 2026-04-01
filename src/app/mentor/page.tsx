"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MentorSelector } from "@/components/mentor/MentorSelector";
import { ChatInterface } from "@/components/mentor/ChatInterface";
import { AIMentor, getMentorById } from "@/lib/ai-mentors";
import { useAuth } from "@/contexts/AuthContext";
import { trackMetaEvent } from "@/lib/analytics";

function GuruPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [selectedMentor, setSelectedMentor] = useState<AIMentor | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [prefetchedMessages, setPrefetchedMessages] = useState<any[] | undefined>(undefined);
    const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
    const { user } = useAuth();

    // Create a new chat session when mentor is selected
    const handleMentorSelect = async (mentor: AIMentor) => {
        setSelectedMentor(mentor);

        // AI 멘토 대화 시작 트래킹 (P0 #2)
        trackMetaEvent('Lead', {
            content_name: mentor.name,
            content_category: 'ai_mentor',
        });

        if (user) {
            try {
                const response = await fetch("/api/chat/sessions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user.id,
                        mentorId: mentor.id,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setSessionId(data.session?.id || null);
                    if (data.messages) {
                        setPrefetchedMessages(data.messages);
                    }
                }
            } catch (error) {
                console.error("Failed to create session:", error);
            }
        }
    };

    // Handle auto-selection based on URL query param
    useEffect(() => {
        const action = searchParams.get("action");
        const mentorId = searchParams.get("mentor") || searchParams.get("persona");
        const queryMessage = searchParams.get("q");

        if (mentorId) {
            const autoMentor = getMentorById(mentorId);
            if (autoMentor && (!selectedMentor || selectedMentor.id !== mentorId)) {
                // If switching mentors, reset everything first
                if (selectedMentor && selectedMentor.id !== mentorId) {
                    setSelectedMentor(null);
                    setSessionId(null);
                    setInitialMessage(undefined);
                }

                // Clean the URL so refreshing doesn't keep triggering it
                router.replace("/mentor", { scroll: false });

                let msg = "";
                if (action === "analyze_portfolio") {
                    msg = "내 포트폴리오를 분석해주세요";
                } else if (queryMessage) {
                    msg = queryMessage;
                }

                if (msg) {
                    setInitialMessage(msg);
                    handleMentorSelect(autoMentor);
                } else {
                    handleMentorSelect(autoMentor);
                }
            }
        }
    }, [searchParams, selectedMentor, router]);

    // Scroll to top when view changes
    useEffect(() => {
        // Ensure scroll reset happens after the DOM has likely updated for the new view
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
            document.body.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }, 0);
        return () => clearTimeout(timer);
    }, [selectedMentor]);

    // Reset session when going back
    const handleBack = () => {
        setSelectedMentor(null);
        setSessionId(null);
        setInitialMessage(undefined);
    };
    return (
        <div 
            className={selectedMentor 
                ? "fixed left-0 right-0 top-0 max-w-md mx-auto flex flex-col px-4 pt-4 pb-3 bg-background z-40" 
                : "flex min-h-screen flex-col p-4 max-w-md mx-auto pb-24"
            }
            style={selectedMentor ? { bottom: "calc(4rem + env(safe-area-inset-bottom))" } : undefined}
        >
            {selectedMentor ? (
                <ChatInterface
                    mentor={selectedMentor}
                    onBack={handleBack}
                    userId={user?.id}
                    sessionId={sessionId || undefined}
                    initialHistory={prefetchedMessages}
                    initialMessage={initialMessage}
                />
            ) : (
                <>
                    <header className="pt-8 pb-6">
                        <h1 className="text-3xl font-bold tracking-tight">AI 투자 멘토</h1>
                        <p className="text-muted-foreground">당신만의 AI 투자 멘토와 대화하세요.</p>
                    </header>
                    <MentorSelector onSelect={handleMentorSelect} />
                </>
            )}
        </div>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">AI 투자 멘토 로딩 중...</div>}>
            <GuruPageContent />
        </Suspense>
    );
}
