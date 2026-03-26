"use client";

import { ProfileSettings } from "@/components/profile/ProfileSettings";

export default function ProfilePage() {
    return (
        <div className="flex min-h-screen flex-col p-4 max-w-md mx-auto pb-24">
            <header className="pt-8 pb-4">
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            </header>
            <ProfileSettings />
        </div>
    );
}
