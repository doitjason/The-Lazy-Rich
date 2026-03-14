"use client";

import { useEffect, useState } from "react";
import { useAuth, UserProfile } from "@/contexts/AuthContext";
import { fetchPosts, Post } from "@/lib/community";
import { FeedItem } from "./FeedItem";
import { Composer } from "./Composer";
import { NativeAdCard } from "./NativeAdCard";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Determine Ad placement frequency
// We start with 7-10 (let's say 8 for simplicity as per phase 1 docs)
const AD_FREQUENCY = 8;

export function CommunityFeed() {
    const { userProfile, signInWithGoogle } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    
    // Auth Modal
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Initial load
    useEffect(() => {
        loadPosts(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile?.id]); // Re-fetch on login to get correct like states

    const loadPosts = async (pageNum: number, isInitial = false) => {
        if (!isInitial) setLoadingMore(true);
        else setLoading(true);

        try {
            const { posts: newPosts, hasNextPage } = await fetchPosts(pageNum, 15, userProfile?.id);
            
            if (isInitial) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }
            
            setHasMore(hasNextPage);
        } catch (error) {
            console.error("Failed to load posts", error);
        } finally {
            if (!isInitial) setLoadingMore(false);
            else setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (loadingMore || !hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadPosts(nextPage);
    };

    const handleRequireLogin = () => {
        setShowAuthModal(true);
    };

    const handlePostCreated = () => {
        setPage(1);
        loadPosts(1, true);
    };

    const handlePostDeleted = (deletedPostId: string) => {
        setPosts(prev => prev.filter(p => p.id !== deletedPostId));
    };

    return (
        <div className="flex flex-col w-full max-w-2xl mx-auto pb-24 animate-in fade-in duration-500">
            <Composer 
                currentUser={userProfile} 
                onRequireLogin={handleRequireLogin} 
                onPostCreated={handlePostCreated} 
            />

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
                    <p className="font-semibold text-foreground/80">첫 번째 투자 고민을 나누어주세요!</p>
                    <p className="text-sm">어떤 작은 고민이라도 환영합니다.</p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {posts.map((post, index) => {
                        return (
                            <div key={post.id}>
                                {/* Show Ad before the post if it's the Nth post */}
                                {index > 0 && index % AD_FREQUENCY === 0 && (
                                    <NativeAdCard />
                                )}
                                <FeedItem 
                                    post={post} 
                                    currentUser={userProfile} 
                                    onRequireLogin={handleRequireLogin} 
                                    onDelete={handlePostDeleted}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {hasMore && !loading && (
                <div className="flex justify-center py-8">
                    <button 
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="text-sm font-medium text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2 px-4 py-2 hover:bg-blue-500/10 rounded-full"
                    >
                        {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "더 보기"}
                    </button>
                </div>
            )}

            {/* Auth Required Modal */}
            <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
                <DialogContent className="sm:max-w-md bg-white/95 dark:bg-[#1a1c23]/95 backdrop-blur-3xl border-white/20 dark:border-white/10 p-6 rounded-2xl z-50">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            로그인이 필요해요
                        </DialogTitle>
                        <DialogDescription className="text-[14px] pt-2 leading-relaxed text-foreground/80">
                            나만의 투자 고민을 나누고, 다른 사람들의 이야기에 공감해 보세요. <br/>
                            1초 만에 로그인하고 커뮤니티에 참여할 수 있습니다.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-2 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setShowAuthModal(false)}>
                            취소
                        </Button>
                        <Button 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                            onClick={() => {
                                setShowAuthModal(false);
                                signInWithGoogle();
                            }}
                        >
                            구글로 빠른 로그인
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
