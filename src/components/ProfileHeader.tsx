import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Settings, MapPin, Calendar, UserPlus, UserCheck, UserX, MessageCircle, Share2, Eye, ShieldOff, BarChart3, Gift } from "lucide-react";
import { OnlineStatusBadge } from "@/components/OnlineStatusBadge";

interface Profile {
  user_id: string;
  username: string;
  full_name: string;
  birth_date: string;
  birth_place: string;
  current_location: string;
  bio: string;
  gender: string;
  profile_photo: string;
}

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
  isBlocked: boolean;
  friendshipStatus: "none" | "pending_sent" | "pending_received" | "accepted";
  onAddFriend: () => void;
  onCancelRequest: () => void;
  onAcceptRequest: () => void;
  onRejectRequest: () => void;
  onRemoveFriend: () => void;
  onMessage: () => void;
  onShare?: () => void;
  onSendGift?: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onSettings: () => void;
  onShowQR?: () => void;
  onPhotoReorder?: () => void;
  onFriendsClick: () => void;
  onViewDetailedStats?: () => void;
  postsCount: number;
  friendsCount: number;
  analysesCount: number;
}

export const ProfileHeader = memo(({
  profile,
  isOwnProfile,
  isBlocked,
  friendshipStatus,
  onAddFriend,
  onCancelRequest,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  onMessage,
  onShare,
  onSendGift,
  onBlock,
  onUnblock,
  onSettings,
  onFriendsClick,
  onViewDetailedStats,
  onShowQR,
  onPhotoReorder,
  postsCount,
  friendsCount,
  analysesCount
}: ProfileHeaderProps) => {
  const navigate = useNavigate();

  return (
    <Card className="p-4 sm:p-6 mb-4 sm:mb-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        <div className="relative">
          <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-primary/20">
            <AvatarImage 
              src={profile.profile_photo || undefined}
              loading="lazy"
              decoding="async"
            />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
              {profile.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isOwnProfile && (
            <div className="absolute bottom-0 right-0">
              <OnlineStatusBadge userId={profile.user_id} />
            </div>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold">{profile.full_name || profile.username}</h1>
            {profile.gender && (
              <Badge variant="secondary">
                {profile.gender === "male" ? "Erkek" : profile.gender === "female" ? "Kadın" : "Diğer"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">@{profile.username}</p>

          {/* Stats */}
          <div className="flex justify-center sm:justify-start gap-6 mb-4">
            <div className="text-center">
              <p className="font-bold text-lg">{postsCount}</p>
              <p className="text-xs text-muted-foreground">Gönderi</p>
            </div>
            <div 
              className="text-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={onFriendsClick}
            >
              <p className="font-bold text-lg">{friendsCount}</p>
              <p className="text-xs text-muted-foreground">Arkadaş</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{analysesCount}</p>
              <p className="text-xs text-muted-foreground">Analiz</p>
            </div>
            {isOwnProfile && onViewDetailedStats && (
              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onViewDetailedStats}
              >
                <BarChart3 className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Detaylı</p>
              </div>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm mb-3 max-w-md">{profile.bio}</p>
          )}

          <div className="flex flex-col gap-2 text-xs sm:text-sm text-muted-foreground mb-4">
            {profile.current_location && (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <MapPin className="w-4 h-4" />
                <span>{profile.current_location}</span>
              </div>
            )}
            {profile.birth_date && (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Calendar className="w-4 h-4" />
                <span>{new Date(profile.birth_date).toLocaleDateString("tr-TR")}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {isOwnProfile ? (
              <Button onClick={onSettings} size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Profili Düzenle
              </Button>
            ) : (
              <>
                {isBlocked ? (
                  <Button onClick={onUnblock} size="sm" variant="outline" className="gap-2">
                    <ShieldOff className="w-4 h-4" />
                    Engeli Kaldır
                  </Button>
                ) : (
                  <>
                    {friendshipStatus === "none" && (
                      <Button onClick={onAddFriend} size="sm" className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Arkadaş Ekle
                      </Button>
                    )}
                    {friendshipStatus === "pending_sent" && (
                      <Button onClick={onCancelRequest} size="sm" variant="outline" className="gap-2">
                        <UserX className="w-4 h-4" />
                        İsteği İptal Et
                      </Button>
                    )}
                    {friendshipStatus === "pending_received" && (
                      <>
                        <Button onClick={onAcceptRequest} size="sm" className="gap-2">
                          <UserCheck className="w-4 h-4" />
                          Kabul Et
                        </Button>
                        <Button onClick={onRejectRequest} size="sm" variant="outline" className="gap-2">
                          <UserX className="w-4 h-4" />
                          Reddet
                        </Button>
                      </>
                    )}
                    {friendshipStatus === "accepted" && (
                      <>
                        <Button onClick={onMessage} size="sm" className="gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Mesaj Gönder
                        </Button>
                        {onSendGift && (
                          <Button onClick={onSendGift} size="sm" variant="outline" className="gap-2">
                            <Gift className="w-4 h-4" />
                            Hediye Gönder
                          </Button>
                        )}
                        <Button onClick={onRemoveFriend} size="sm" variant="outline" className="gap-2">
                          <UserX className="w-4 h-4" />
                          Arkadaşlıktan Çıkar
                        </Button>
                      </>
                    )}
                    {onShare && (
                      <Button onClick={onShare} size="sm" variant="outline" className="gap-2">
                        <Share2 className="w-4 h-4" />
                        Paylaş
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

ProfileHeader.displayName = "ProfileHeader";
