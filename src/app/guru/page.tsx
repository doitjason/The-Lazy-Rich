"use client";

import { useState, useEffect } from "react";
import { GuruSelector } from "@/components/guru/GuruSelector";
import { ChatInterface } from "@/components/guru/ChatInterface";
import { GuruPersona } from "@/lib/guru-personas";
import { useAuth } from "@/contexts/AuthContext";
import { BrandStoryDialog } from "@/components/layout/BrandStoryDialog";

export default function GuruPage() {
    const [selectedGuru, setSelectedGuru] = useState<GuruPersona | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
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
    };

    return (
        <div className="flex min-h-screen flex-col p-4 max-w-md mx-auto pb-24">
            {selectedGuru ? (
                <ChatInterface
                    guru={selectedGuru}
                    onBack={handleBack}
                    userId={user?.id}
                    sessionId={sessionId || undefined}
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
