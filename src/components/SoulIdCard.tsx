
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Sparkles, Star, Zap } from "lucide-react";

interface SoulIdCardProps {
    profile: any;
    isOwnProfile: boolean;
}

export const SoulIdCard = ({ profile, isOwnProfile }: SoulIdCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md mx-auto"
        >
            {/* Holographic Container */}
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-black/40 backdrop-blur-xl shadow-neon group">

                {/* Iridescent Background Animation */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-blue-500/10 opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
                <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 animate-[shimmer_8s_infinite]" />

                {/* Card Content */}
                <div className="relative p-6 flex flex-col items-center">

                    {/* Avatar with Orbit Ring */}
                    <div className="relative mb-4">
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-accent animate-[spin_4s_linear_infinite]" />
                        <div className="absolute -inset-1 rounded-full border border-white/10" />

                        <Avatar className="w-24 h-24 border-2 border-white/20 shadow-xl">
                            <AvatarImage src={profile.profile_photo || "/placeholder.svg"} className="object-cover" />
                            <AvatarFallback className="bg-primary/20 text-white text-2xl">
                                {profile.full_name?.charAt(0) || profile.username?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Level Badge */}
                        <div className="absolute -bottom-2 -right-2 bg-black/80 backdrop-blur-md border border-amber-500/50 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-glow">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-bold text-amber-100">LVL {profile.level || 1}</span>
                        </div>
                    </div>

                    {/* Identity Info */}
                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        {profile.full_name || profile.username}
                        {profile.is_verified && <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 text-[10px] px-1 py-0 h-4">✓</Badge>}
                    </h2>
                    <p className="text-sm text-white/50 mb-4 font-mono tracking-wide">@{profile.username}</p>

                    {/* Soul Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 w-full mb-4">
                        <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="text-xs text-white/40 mb-1 uppercase tracking-wider">Aura</div>
                            <div className="text-sm font-bold text-primary flex justify-center items-center gap-1">
                                <Sparkles className="w-3 h-3" /> {profile.aura_points || 0}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="text-xs text-white/40 mb-1 uppercase tracking-wider">Ruh</div>
                            <div className="text-sm font-bold text-accent flex justify-center items-center gap-1">
                                <Zap className="w-3 h-3" /> {profile.soul_points || 0}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="text-xs text-white/40 mb-1 uppercase tracking-wider">Takipçi</div>
                            <div className="text-sm font-bold text-white flex justify-center items-center gap-1">
                                {profile.followers_count || 0}
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                        <p className="text-sm text-white/70 text-center leading-relaxed max-w-[90%] font-light italic">
                            "{profile.bio}"
                        </p>
                    )}

                </div>
            </div>
        </motion.div>
    );
};
