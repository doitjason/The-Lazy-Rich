"use client";

import { useState } from "react";
import { GuruSelector } from "@/components/guru/GuruSelector";
import { ChatInterface } from "@/components/guru/ChatInterface";
import { GuruPersona } from "@/lib/dummy-data";

export default function GuruPage() {
    const [selectedGuru, setSelectedGuru] = useState<GuruPersona | null>(null);

    return (
        <div className="flex min-h-screen flex-col p-4 max-w-md mx-auto pb-24">
            {selectedGuru ? (
                <ChatInterface
                    guru={selectedGuru}
                    onBack={() => setSelectedGuru(null)}
                />
            ) : (
                <>
                    <header className="pt-8 pb-6">
                        <h1 className="text-3xl font-bold tracking-tight">AI Guru</h1>
                        <p className="text-muted-foreground">Your personal investment mentor.</p>
                    </header>
                    <GuruSelector onSelect={setSelectedGuru} />
                </>
            )}
        </div>
    );
}
