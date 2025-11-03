import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageCircle, Heart, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  profile: {
    username: string;
    full_name: string | null;
    profile_photo: string | null;
  };
  likes: number;
  comments: number;
  hasLiked: boolean;
}

interface ProfilePostsProps {
  posts: Post[];
  loading: boolean;
  isOwnProfile: boolean;
}

export const ProfilePosts = ({ posts, loading, isOwnProfile }: ProfilePostsProps) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-lg mb-2">
            {isOwnProfile ? "Henüz gönderi paylaşmadınız" : "Henüz gönderi yok"}
          </p>
          {isOwnProfile && (
            <p className="text-sm text-muted-foreground">
              İlk gönderinizi oluşturmak için + butonuna tıklayın
            </p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="ring-2 ring-border">
                    <AvatarImage src={post.profile.profile_photo || undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {post.profile.full_name?.[0] || post.profile.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{post.profile.full_name || post.profile.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
                    </p>
                  </div>
                </div>
              </div>

              {post.content && (
                <p className="text-foreground whitespace-pre-wrap mb-3 text-sm leading-relaxed">{post.content}</p>
              )}
            </div>

            {post.media_url && (
              <div className="w-full">
                {post.media_type === "photo" ? (
                  <img 
                    src={post.media_url} 
                    alt="Post media" 
                    className="w-full max-h-[500px] object-cover"
                  />
                ) : (
                  <video 
                    src={post.media_url} 
                    controls 
                    className="w-full max-h-[500px]"
                  />
                )}
              </div>
            )}

            <div className="p-4">
              <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                <span>{post.likes} beğeni</span>
                <span>{post.comments} yorum</span>
              </div>

              <Separator className="mb-3" />

              <div className="flex items-center justify-around">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Heart className={`w-5 h-5 ${post.hasLiked ? "fill-red-500 text-red-500" : ""}`} />
                  Beğen
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Yorum
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Paylaş
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};