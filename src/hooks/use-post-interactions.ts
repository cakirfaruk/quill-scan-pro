import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Post } from "@/types/feed";
import { soundEffects } from "@/utils/soundEffects";

interface UsePostInteractionsProps {
    userId: string;
    updatePost: (post: Post) => void;
}

export const usePostInteractions = ({ userId, updatePost }: UsePostInteractionsProps) => {
    const { toast } = useToast();
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [postToSave, setPostToSave] = useState<Post | null>(null);

    const handleLike = useCallback(async (post: Post) => {
        const previousState = { ...post };
        const newHasLiked = !post.hasLiked;
        const newLikesCount = newHasLiked ? post.likes + 1 : post.likes - 1;

        // Optimistic Update
        updatePost({
            ...post,
            hasLiked: newHasLiked,
            likes: newLikesCount
        });

        if (newHasLiked) {
            soundEffects.playLike();
        }

        try {
            if (post.hasLiked) {
                // Unlike
                const { error } = await supabase
                    .from("post_likes")
                    .delete()
                    .eq("post_id", post.id)
                    .eq("user_id", userId);

                if (error) throw error;
            } else {
                // Like
                const { error } = await supabase
                    .from("post_likes")
                    .insert({ post_id: post.id, user_id: userId });

                if (error) throw error;
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            soundEffects.playError();
            toast({
                title: "Hata",
                description: "İşlem gerçekleştirilemedi",
                variant: "destructive"
            });
            // Revert Optimistic Update
            updatePost(previousState);
        }
    }, [userId, updatePost, toast]);

    const handleSave = useCallback(async (post: Post) => {
        // If already saved, unsave immediately
        if (post.hasSaved) {
            const previousState = { ...post };
            // Optimistic Update
            updatePost({
                ...post,
                hasSaved: false
            });

            try {
                await supabase
                    .from("saved_posts")
                    .delete()
                    .eq("post_id", post.id)
                    .eq("user_id", userId);

                toast({ title: "Kaydedildi", description: "Gönderi kaydedilenlerden kaldırıldı" });
            } catch (error) {
                console.error("Error removing save:", error);
                soundEffects.playError();
                toast({ title: "Hata", description: "İşlem gerçekleştirilemedi", variant: "destructive" });
                // Revert
                updatePost(previousState);
            }
        } else {
            // If not saved, open dialog (cannot optimistically update yet as we need collection selection)
            setPostToSave(post);
            setSaveDialogOpen(true);
        }
    }, [userId, updatePost, toast]);

    return {
        handleLike,
        handleSave,
        saveDialogOpen,
        setSaveDialogOpen,
        postToSave,
        setPostToSave
    };
};
