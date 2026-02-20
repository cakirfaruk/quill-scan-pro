import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Post, Friend } from "@/types/feed";

interface UseFeedPostsReturn {
    friendsPosts: Post[];
    allPosts: Post[];
    friends: Friend[]; // Added
    loading: boolean;
    hasMoreFriendsPosts: boolean;
    hasMoreAllPosts: boolean;
    loadPosts: (userId: string, page?: number, reset?: boolean) => Promise<void>;
    updatePost: (updatedPost: Post) => void;
    setFriendsPosts: React.Dispatch<React.SetStateAction<Post[]>>;
    setAllPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}

export const useFeedPosts = (): UseFeedPostsReturn => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [friendsPosts, setFriendsPosts] = useState<Post[]>([]);
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]); // Added
    const [hasMoreFriendsPosts, setHasMoreFriendsPosts] = useState(true);
    const [hasMoreAllPosts, setHasMoreAllPosts] = useState(true);

    const updatePost = useCallback((updatedPost: Post) => {
        setFriendsPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
        setAllPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    }, []);

    const loadPosts = useCallback(async (currentUserId: string, page: number = 1, reset: boolean = false) => {
        try {
            if (reset) {
                setLoading(true);
            }

            const POSTS_PER_PAGE = 10;
            const offset = (page - 1) * POSTS_PER_PAGE;

            // STAGE 1: Posts + Friends in PARALLEL (friends don't need postIds)
            const [postsResult, friendsResult] = await Promise.all([
                supabase
                    .from("posts")
                    .select(`
                        id, user_id, content, media_url, media_type, created_at, shares_count,
                        profiles!posts_user_id_fkey (
                          user_id,
                          username,
                          full_name,
                          profile_photo
                        )
                    `)
                    .order("created_at", { ascending: false })
                    .range(offset, offset + POSTS_PER_PAGE - 1),
                supabase
                    .from("friends")
                    .select("user_id, friend_id")
                    .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
                    .eq("status", "accepted"),
            ]);

            if (postsResult.error) throw postsResult.error;

            const fetchedPosts = postsResult.data || [];
            const postIds = fetchedPosts.map(p => p.id);

            // STAGE 2: Likes + Saves need postIds (parallel with each other)
            const [userLikesResult, userSavesResult] = await Promise.all([
                postIds.length > 0 ? supabase
                    .from("post_likes")
                    .select("post_id")
                    .eq("user_id", currentUserId)
                    .in("post_id", postIds) : { data: [] },
                postIds.length > 0 ? supabase
                    .from("saved_posts")
                    .select("post_id")
                    .eq("user_id", currentUserId)
                    .in("post_id", postIds) : { data: [] }
            ]);

            const userLikesSet = new Set(userLikesResult.data?.map(l => l.post_id) || []);
            const userSavesSet = new Set(userSavesResult.data?.map(s => s.post_id) || []);

            // Enrich posts - use server-side counts from posts table
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const postsWithData: Post[] = fetchedPosts.map((post: any) => ({
                id: post.id,
                user_id: post.user_id,
                content: post.content,
                media_url: post.media_url,
                media_type: post.media_type,
                created_at: post.created_at,
                shares_count: post.shares_count || 0,
                profile: {
                    user_id: post.profiles.user_id,
                    username: post.profiles.username,
                    full_name: post.profiles.full_name,
                    profile_photo: post.profiles.profile_photo
                },
                likes: post.likes_count || 0,
                comments: post.comments_count || 0,
                hasLiked: userLikesSet.has(post.id),
                hasSaved: userSavesSet.has(post.id),
            }));

            // Calculate friend IDs
            const friendIds = new Set(
                (friendsResult.data || []).map(f =>
                    f.user_id === currentUserId ? f.friend_id : f.user_id
                )
            );

            const newFriendsPosts = postsWithData.filter(post =>
                friendIds.has(post.user_id) || post.user_id === currentUserId
            );

            // Check if there are more posts
            const hasMore = postsWithData.length === POSTS_PER_PAGE;

            if (reset) {
                setFriendsPosts(newFriendsPosts);
                setAllPosts(postsWithData);
            } else {
                setFriendsPosts(prev => [...prev, ...newFriendsPosts]);
                setAllPosts(prev => [...prev, ...postsWithData]);
            }

            setHasMoreFriendsPosts(hasMore && newFriendsPosts.length > 0);
            setHasMoreAllPosts(hasMore);

        } catch (error) {
            console.error("Error loading posts:", error);
            toast({
                title: "Hata",
                description: "Paylaşımlar yüklenirken bir hata oluştu",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    return {
        friendsPosts,
        allPosts,
        loading,
        hasMoreFriendsPosts,
        hasMoreAllPosts,
        loadPosts,
        updatePost,
        setFriendsPosts,
        setAllPosts,
        friends // Added
    };
};

