import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, UserPlus, X, Sparkles, UserMinus } from "lucide-react";
import { getOptimizedImageUrl } from "@/utils/image-optimizer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TemporaryProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: {
        user_id: string;
        username: string;
        full_name: string | null;
        profile_photo: string | null;
        bio?: string | null;
        birth_date?: string | null;
    } | null;
    onAddFriend: () => void;
    onRemoveMatch: () => void;
    isAdding?: boolean;
    isRemoving?: boolean;
}

export const TemporaryProfileDialog = ({
    open,
    onOpenChange,
    profile,
    onAddFriend,
    onRemoveMatch,
    isAdding = false,
    isRemoving = false
}: TemporaryProfileDialogProps) => {
    if (!profile) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-3xl">
                <div className="relative w-full h-[60vh] min-h-[400px]">
                    {/* Photo */}
                    <div className="absolute inset-0 bg-black">
                        <img
                            src={getOptimizedImageUrl(profile.profile_photo || "/placeholder.svg", 600, 800, { resize: 'cover' })}
                            alt={profile.username}
                            className="w-full h-full object-cover"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 opacity-90" />

                        {/* Top cosmic flair */}
                        <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[40%] bg-primary/20 blur-[80px] rounded-full mix-blend-screen pointer-events-none" />
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-6 z-10 text-white flex flex-col justify-end">
                        <h2 className="text-3xl font-black drop-shadow-xl flex items-baseline gap-2 leading-none mb-1 text-center justify-center">
                            {profile.full_name || profile.username}
                            {profile.birth_date && (
                                <span className="text-xl font-light text-white/70">
                                    {new Date().getFullYear() - new Date(profile.birth_date).getFullYear()}
                                </span>
                            )}
                        </h2>

                        <p className="text-center text-white/50 text-sm mb-4">@{profile.username}</p>

                        {profile.bio && (
                            <p className="text-center text-white/80 text-sm mb-6 max-h-20 overflow-y-auto w-full custom-scrollbar line-clamp-3">
                                {profile.bio}
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <Button
                                variant="outline"
                                className="h-12 bg-black/50 border-destructive/30 hover:bg-destructive/20 hover:border-destructive text-destructive transition-all rounded-xl"
                                onClick={onRemoveMatch}
                                disabled={isRemoving}
                            >
                                <UserMinus className="w-4 h-4 mr-2" />
                                Match Kaldır
                            </Button>
                            <Button
                                className="h-12 bg-gradient-to-r from-primary to-green-500 hover:opacity-90 transition-all rounded-xl border border-white/10 shadow-[0_0_15px_rgba(34,197,94,0.3)] text-white"
                                onClick={onAddFriend}
                                disabled={isAdding}
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Arkadaş Ekle
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
