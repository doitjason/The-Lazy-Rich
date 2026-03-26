import { createClient } from "./supabase/client";

export type Post = {
    id: string;
    user_id: string;
    user_name: string;
    user_avatar: string;
    content: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    has_liked?: boolean; // Added on client-side
};

export type Comment = {
    id: string;
    post_id: string;
    user_id: string;
    user_name: string;
    user_avatar: string;
    content: string;
    created_at: string;
};

export type SmartLinkType = "calc";
export type SmartLinkCalcId = "regret" | "regret-v2" | "compound";

export interface SmartLinkData {
    type: SmartLinkType;
    id: string;
    params: Record<string, string>;
    raw: string; // The original {link:...} string
}

const CALC_NAMES: Record<string, string> = {
    "regret": "했제 계산기 V1",
    "regret-v2": "했제 계산기 V2",
    "compound": "자유 계산기",
};

export function getCalcName(id: string): string {
    return CALC_NAMES[id] || id;
}

export function parseSmartLinks(content: string): SmartLinkData[] {
    const regex = /\{link:(calc):([^:]+):([^}]+)\}/g;
    const links: SmartLinkData[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
        const [raw, type, id, paramsStr] = match;
        const params: Record<string, string> = {};
        
        paramsStr.split('&').forEach(p => {
            const [key, value] = p.split('=');
            if (key && value) params[key] = decodeURIComponent(value);
        });

        links.push({
            type: type as SmartLinkType,
            id,
            params,
            raw
        });
    }

    return links;
}

// 1. Fetch Posts with Pagination
export async function fetchPosts(page = 1, limit = 15, currentUserId?: string): Promise<{ posts: Post[], hasNextPage: boolean }> {
    const supabase = createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // First fetch the posts
    const { data: posts, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Error fetching posts:", error);
        return { posts: [], hasNextPage: false };
    }

    if (!posts || posts.length === 0) {
        return { posts: [], hasNextPage: false };
    }

    let resultPosts: Post[] = posts;

    // If logged in, fetch which of these posts the user has liked
    if (currentUserId) {
        const postIds = posts.map(p => p.id);
        const { data: likes } = await supabase
            .from('community_likes')
            .select('post_id')
            .in('post_id', postIds)
            .eq('user_id', currentUserId);

        const likedPostIds = new Set(likes?.map(l => l.post_id) || []);

        resultPosts = posts.map(post => ({
            ...post,
            has_liked: likedPostIds.has(post.id)
        }));
    }

    return {
        posts: resultPosts,
        hasNextPage: posts.length === limit // Very simple approach to pagination check
    };
}

// 2. Create Post
export async function createPost(
    userId: string,
    userName: string,
    userAvatar: string,
    content: string
): Promise<Post | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('community_posts')
        .insert([{
            user_id: userId,
            user_name: userName,
            user_avatar: userAvatar,
            content
        }])
        .select()
        .single();

    if (error) {
        console.error("Error creating post:", error);
        return null;
    }

    return data;
}

// 3. Toggle Like
export async function toggleLike(postId: string, userId: string, isCurrentlyLiked: boolean): Promise<boolean> {
    const supabase = createClient();

    if (isCurrentlyLiked) {
        // Unlike
        const { error } = await supabase
            .from('community_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);

        if (error) {
            console.error("Error unliking post:", error);
            return false;
        }
    } else {
        // Like
        const { error } = await supabase
            .from('community_likes')
            .insert([{ post_id: postId, user_id: userId }]);

        if (error) {
            console.error("Error liking post:", error);
            return false;
        }
    }

    return true;
}

// 4. Fetch Comments for a Post
export async function fetchComments(postId: string): Promise<Comment[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching comments:", error);
        return [];
    }

    return data || [];
}

// 5. Create Comment
export async function createComment(
    postId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    content: string
): Promise<Comment | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('community_comments')
        .insert([{
            post_id: postId,
            user_id: userId,
            user_name: userName,
            user_avatar: userAvatar,
            content
        }])
        .select()
        .single();

    if (error) {
        console.error("Error creating comment:", error);
        return null;
    }

    return data;
}

// 6. Update User Nickname (Profile)
export async function updateNickname(userId: string, newNickname: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    // 1. Check if nickname is already taken (case-insensitive check would be better, but let's stick to simple first)
    const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', newNickname)
        .maybeSingle();

    if (existing) {
        return { success: false, error: "이미 사용 중인 닉네임입니다." };
    }

    // 2. Update nickname
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ nickname: newNickname, updated_at: new Date().toISOString() })
        .eq('id', userId);

    if (updateError) {
        console.error("Error updating nickname:", updateError);
        return { success: false, error: "닉네임 변경 중 오류가 발생했습니다." };
    }

    return { success: true };
}

// 7. Update User Avatar (Profile)
export async function updateAvatar(userId: string, avatarUrl: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

    if (error) {
        console.error("Error updating avatar:", error);
        return { success: false, error: "프로필 이미지 변경 중 오류가 발생했습니다." };
    }

    return { success: true };
}

// 8. Delete Post
export async function deletePost(postId: string, userId: string): Promise<boolean> {
    const supabase = createClient();
    
    const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);

    if (error) {
        console.error("Error deleting post:", error);
        return false;
    }

    return true;
}
// 8. Update Post
export async function updatePost(postId: string, userId: string, content: string): Promise<boolean> {
    const supabase = createClient();
    
    const { error } = await supabase
        .from('community_posts')
        .update({ content })
        .eq('id', postId)
        .eq('user_id', userId);

    if (error) {
        console.error("Error updating post:", error.message, error.details, error.hint);
        return false;
    }

    return true;
}
