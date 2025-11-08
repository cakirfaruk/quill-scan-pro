import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { MapPin, Image as ImageIcon, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SharedPostData {
  type: 'shared_post';
  postId: string;
  author: {
    username: string;
    fullName: string | null;
    profilePhoto: string | null;
  };
  content: string | null;
  mediaUrls: string[] | null;
  mediaTypes: string[] | null;
  createdAt: string;
  locationName?: string | null;
}

interface SharedPostCardProps {
  data: SharedPostData;
}

export function SharedPostCard({ data }: SharedPostCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="mt-2 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/20 bg-gradient-to-br from-background to-muted/10"
      onClick={() => navigate(`/feed`)}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/5 to-transparent">
        <Avatar 
          className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${data.author.username}`);
          }}
        >
          <AvatarImage 
            src={data.author.profilePhoto || undefined}
            loading="lazy"
          />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
            {data.author.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p 
            className="font-semibold text-sm truncate hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${data.author.username}`);
            }}
          >
            {data.author.fullName || data.author.username}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(data.createdAt), { addSuffix: true, locale: tr })}
          </p>
          {data.locationName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {data.locationName}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      {data.content && (
        <div className="px-3 py-2">
          <p className="text-sm line-clamp-3">{data.content}</p>
        </div>
      )}

      {/* Media Preview */}
      {data.mediaUrls && data.mediaUrls.length > 0 && (
        <div className="relative bg-muted/30 p-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {data.mediaTypes?.[0] === 'video' ? (
              <>
                <Video className="w-4 h-4" />
                <span>Video içerik</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                <span>{data.mediaUrls.length} fotoğraf</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-2 bg-muted/20 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Paylaşılan gönderi • Detaylar için tıklayın
        </p>
      </div>
    </Card>
  );
}
