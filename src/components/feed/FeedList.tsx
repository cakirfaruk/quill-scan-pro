import { Post } from "@/types/feed";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Users, Rss } from "lucide-react";
import { NoFriendsIllustration, NoPostsIllustration } from "@/components/EmptyStateIllustrations";
import { useNavigate } from "react-router-dom";

interface FeedListProps {
    posts: Post[];
    loading: boolean;
    currentUserId: string;
    type: "friends" | "discover";
    onLike: (post: Post) => void;
    onComment: (post: Post) => void;
    onShare: (post: Post) => void;
    onSave: (post: Post) => void;
    hasMore: boolean;
    infiniteScrollRef: React.RefObject<HTMLDivElement>;
    isLoadingMore: boolean;
}

export const FeedList = ({
    posts,
    loading,
    currentUserId,
    type,
    onLike,
    onComment,
    onShare,
    onSave,
    hasMore,
    infiniteScrollRef,
    isLoadingMore
}: FeedListProps) => {
    const navigate = useNavigate();

    if (loading && posts.length === 0) {
        return (
            <div className="py-8">
                <LoadingSpinner size="lg" text="Paylaşımlar yükleniyor..." />
            </div>
        );
    }

    if (posts.length === 0) {
        if (type === "friends") {
            return (
                <EmptyState
                    icon={Users}
                    title="Henüz arkadaşınızın paylaşımı yok"
                    description="Arkadaşlarınızın paylaşımlarını görmek için keşfet sekmesinden yeni insanlarla tanışın ve arkadaş olun."
                    actionLabel="Arkadaş Bul"
                    onAction={() => navigate("/discovery")}
                    illustration={<NoFriendsIllustration />}
                    variant="gradient"
                />
            );
        } else {
            return (
                <EmptyState
                    icon={Rss}
                    title="Henüz paylaşım yok"
                    description="İlk paylaşımı siz yapın! Fotoğraf, video veya düşüncelerinizi paylaşarak topluluğa katılın."
                    actionLabel="İlk Paylaşımı Yap"
                    onAction={() => navigate("/profile")}
                    illustration={<NoPostsIllustration />}
                    variant="gradient"
                />
            );
        }
    }

    return (
        <div className="space-y-6">
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onLike={() => onLike(post)}
                    onComment={() => onComment(post)}
                    onShare={() => onShare(post)}
                    onSave={() => onSave(post)}
                />
            ))}

            {/* Infinite Scroll Sentinel */}
            {hasMore && (
                <div ref={infiniteScrollRef} className="h-10 w-full flex justify-center p-4">
                    {isLoadingMore && <LoadingSpinner size="sm" />}
                </div>
            )}

            {!hasMore && posts.length > 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    Tüm gönderileri gördünüz ✨
                </div>
            )}
        </div>
    );
};
