import { useState, memo } from "react";
import { getOptimizedImageUrl } from "@/utils/image-optimizer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    Bookmark
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { ParsedText } from "@/components/ParsedText";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useNavigate } from "react-router-dom";
import { OptimizedImage } from "@/components/OptimizedImage";

interface PostCardProps {
    post: any;
    currentUserId: string;
    onLike: (postId: string, hasLiked: boolean) => void;
    onComment: (post: any) => void;
    onShare: (post: any) => void;
    onSave: (postId: string, hasSaved: boolean) => void;
}

export const PostCard = memo(({
    post,
    currentUserId,
    onLike,
    onComment,
    onShare,
    onSave
}: PostCardProps) => {
    const navigate = useNavigate();
    const [isLikeAnimating, setIsLikeAnimating] = useState(false);

    const handleLikeClick = () => {
        setIsLikeAnimating(true);
        onLike(post.id, post.hasLiked);
        setTimeout(() => setIsLikeAnimating(false), 300);
    };

    return (
        <ScrollReveal direction="up" delay={0}>
            <Card className="mb-8 relative overflow-hidden bg-black/40 backdrop-blur-2xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-[2rem] group hover:border-white/10 transition-all duration-500">
                {/* Subtle top glow on hover */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                {/* Header */}
                <div className="flex items-center gap-4 p-5 relative z-10">
                    <Avatar
                        className="w-12 h-12 cursor-pointer ring-2 ring-white/10 group-hover:ring-primary/50 shadow-glass transition-all duration-500"
                        onClick={() => navigate(`/profile/${post.profile.username}`)}
                    >
                        <AvatarImage src={getOptimizedImageUrl(post.profile.profile_photo || undefined, 64, 64, { resize: 'cover' })} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-tr from-primary/20 to-accent/20 text-white font-bold backdrop-blur-md border border-white/10">
                            {post.profile.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => navigate(`/profile/${post.profile.username}`)}
                        >
                            <p className="font-bold text-base text-white hover:text-primary transition-colors truncate tracking-wide">
                                {post.profile.full_name || post.profile.username}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5 opacity-70">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
                        </p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black/90 border-white/10 backdrop-blur-xl rounded-2xl shadow-neon">
                            <DropdownMenuItem onClick={() => onSave(post.id, post.hasSaved)} className="cursor-pointer focus:bg-white/10 rounded-xl m-1 transition-colors">
                                <Bookmark className="w-4 h-4 mr-2" />
                                {post.hasSaved ? "Kaydedilenlerden Kaldır" : "Koleksiyona Kaydet"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onShare(post)} className="cursor-pointer focus:bg-white/10 rounded-xl m-1 transition-colors">
                                <Share2 className="w-4 h-4 mr-2" />
                                Paylaş
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Content */}
                {post.content && (
                    <div className="px-5 pb-4 relative z-10">
                        <div className="text-[15px] sm:text-base leading-relaxed text-white/90 font-medium">
                            <ParsedText text={post.content} />
                        </div>
                    </div>
                )}

                {/* Media */}
                {post.media_url && (
                    <div className="relative overflow-hidden bg-black/80 mt-2">
                        {post.media_type === "image" ? (
                            <OptimizedImage
                                src={post.media_url}
                                alt="Post content"
                                width={800}
                                height={800}
                                objectFit="cover"
                                className="w-full bg-black/50 min-h-[300px]"
                                imgClassName="w-full h-auto max-h-[600px] object-cover hover:scale-[1.03] transition-transform duration-1000 ease-out"
                            />
                        ) : post.media_type === "video" ? (
                            <video
                                src={post.media_url}
                                controls
                                className="w-full max-h-[600px] object-contain"
                            />
                        ) : null}
                    </div>
                )}

                {/* Stats */}
                <div className="px-5 pt-4 pb-2 flex items-center justify-between text-[13px] text-white/50 font-medium tracking-wide">
                    <span className="flex items-center gap-1.5 hover:text-white/80 transition-colors cursor-pointer">
                        <span className="font-bold text-white">{post.likes}</span> Beğeni
                    </span>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1.5 hover:text-white/80 transition-colors cursor-pointer">
                            <span className="font-bold text-white">{post.comments}</span> Yorum
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-white/80 transition-colors cursor-pointer">
                            <span className="font-bold text-white">{post.shares_count}</span> Paylaşım
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-3">
                    <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-[1.5rem] p-1.5 backdrop-blur-md">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`flex-1 h-10 gap-2 rounded-xl transition-all duration-300 font-semibold
                                ${post.hasLiked
                                    ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400"
                                    : "text-white/60 hover:text-white hover:bg-white/10"
                                } 
                                ${isLikeAnimating ? "scale-90" : "scale-100"}`}
                            onClick={handleLikeClick}
                        >
                            <Heart className={`w-[1.125rem] h-[1.125rem] ${post.hasLiked ? "fill-current" : ""}`} />
                            <span className="hidden sm:inline">Beğeni</span>
                        </Button>

                        <div className="w-[1px] h-6 bg-white/10 mx-1" />

                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-10 gap-2 rounded-xl text-white/60 hover:text-primary hover:bg-primary/10 transition-all duration-300 font-semibold"
                            onClick={() => onComment(post)}
                        >
                            <MessageCircle className="w-[1.125rem] h-[1.125rem]" />
                            <span className="hidden sm:inline">Yorum</span>
                        </Button>

                        <div className="w-[1px] h-6 bg-white/10 mx-1" />

                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-10 gap-2 rounded-xl text-white/60 hover:text-accent hover:bg-accent/10 transition-all duration-300 font-semibold"
                            onClick={() => onShare(post)}
                        >
                            <Share2 className="w-[1.125rem] h-[1.125rem]" />
                            <span className="hidden sm:inline">Paylaş</span>
                        </Button>
                    </div>
                </div>
            </Card>
        </ScrollReveal>
    );
});

PostCard.displayName = "PostCard";
