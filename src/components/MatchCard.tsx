import { useState, memo, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, X, Sparkles, Star, MapPin, Calendar, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OnlineStatusBadge } from "./OnlineStatusBadge";

interface MatchCardProps {
  profile: {
    user_id: string;
    username: string;
    full_name: string | null;
    profile_photo: string | null;
    bio: string | null;
    birth_date: string | null;
    gender: string | null;
    photos: { photo_url: string }[];
    has_numerology: boolean;
    has_birth_chart: boolean;
  };
  compatibilityScore?: number;
  onLike: () => void;
  onPass: () => void;
  onViewProfile: () => void;
  onShowCompatibility: () => void;
}

export const MatchCard = memo(({
  profile,
  compatibilityScore,
  onLike,
  onPass,
  onViewProfile,
  onShowCompatibility,
}: MatchCardProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Memoize photos array to prevent recalculation
  const photos = useMemo(() => [
    profile.profile_photo,
    ...profile.photos.map(p => p.photo_url)
  ].filter(Boolean), [profile.profile_photo, profile.photos]);

  // Memoize callbacks to prevent re-renders
  const nextPhoto = useCallback(() => {
    setDirection(1);
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    setDirection(-1);
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Memoize age calculation
  const age = useMemo(() => {
    if (!profile.birth_date) return null;
    const today = new Date();
    const birth = new Date(profile.birth_date);
    let calculatedAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  }, [profile.birth_date]);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden max-w-md mx-auto shadow-2xl border-border/50">
        {/* Photo Carousel */}
        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.img
              key={currentPhotoIndex}
              src={photos[currentPhotoIndex] as string}
              alt={profile.full_name || profile.username}
              className="absolute inset-0 w-full h-full object-cover"
              custom={direction}
              initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>

          {/* Photo Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
              >
                ‹
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
              >
                ›
              </button>
              
              {/* Photo Indicators */}
              <div className="absolute top-4 left-0 right-0 flex gap-1 px-4">
                {photos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      idx === currentPhotoIndex ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Compatibility Badge */}
          {compatibilityScore !== undefined && compatibilityScore > 0 && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-primary text-primary-foreground px-3 py-1.5 shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                %{compatibilityScore} Uyum
              </Badge>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Profile Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-3xl font-bold mb-1">
              {profile.full_name || profile.username}
              {age && (
                <span className="text-xl font-normal ml-2">
                  {age}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-white/90 text-sm">@{profile.username}</p>
              <OnlineStatusBadge userId={profile.user_id} showLastSeen={false} size="sm" />
            </div>

            {profile.bio && (
              <p className="text-white/90 text-sm line-clamp-2 mb-3">{profile.bio}</p>
            )}

            {/* Analysis Badges */}
            <div className="flex gap-2 flex-wrap">
              {profile.has_numerology && (
                <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                  <Star className="w-3 h-3 mr-1" />
                  Numeroloji
                </Badge>
              )}
              {profile.has_birth_chart && (
                <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Doğum Haritası
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6">
          <div className="flex gap-3 justify-center">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                size="icon"
                variant="outline"
                className="w-16 h-16 rounded-full border-2 hover:border-red-500 hover:bg-red-50 transition-all"
                onClick={onPass}
              >
                <X className="w-6 h-6 text-red-500" />
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                size="icon"
                variant="outline"
                className="w-14 h-14 rounded-full border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
                onClick={onViewProfile}
              >
                <Eye className="w-5 h-5 text-blue-500" />
              </Button>
            </motion.div>

            {(profile.has_numerology || profile.has_birth_chart) && (
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-14 h-14 rounded-full border-2 hover:border-purple-500 hover:bg-purple-50 transition-all"
                  onClick={onShowCompatibility}
                >
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </Button>
              </motion.div>
            )}

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 shadow-lg shadow-pink-500/50"
                onClick={onLike}
              >
                <Heart className="w-6 h-6 text-white" />
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});