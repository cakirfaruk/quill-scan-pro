import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Filter, X, Sparkles, MapPin, Calendar, Heart } from "lucide-react";

interface MatchFilters {
    gender: string | "all";
    ageRange: [number, number];
    maxDistance: number;
    zodiacSigns: string[];
    hasPhoto: boolean;
}

interface MatchPreferencesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: MatchFilters;
    onSave: (filters: MatchFilters) => void;
}

const ZODIAC_SIGNS = [
    "Koç", "Boğa", "İkizler", "Yengeç",
    "Aslan", "Başak", "Terazi", "Akrep",
    "Yay", "Oğlak", "Kova", "Balık"
];

export const MatchPreferencesDialog = ({
    open,
    onOpenChange,
    filters,
    onSave,
}: MatchPreferencesDialogProps) => {
    const [localFilters, setLocalFilters] = useState<MatchFilters>(filters);

    // Reset local filters when dialog opens
    useEffect(() => {
        if (open) {
            setLocalFilters(filters);
        }
    }, [open, filters]);

    const handleAgeChange = (value: number[]) => {
        setLocalFilters(prev => ({ ...prev, ageRange: [value[0], value[1]] }));
    };

    const handleDistanceChange = (value: number[]) => {
        setLocalFilters(prev => ({ ...prev, maxDistance: value[0] }));
    };

    const toggleZodiac = (sign: string) => {
        setLocalFilters(prev => {
            const current = prev.zodiacSigns;
            if (current.includes(sign)) {
                return { ...prev, zodiacSigns: current.filter(s => s !== sign) };
            } else {
                return { ...prev, zodiacSigns: [...current, sign] };
            }
        });
    };

    const handleSave = () => {
        onSave(localFilters);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] glass-card border-white/10 text-white p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        <Filter className="w-5 h-5 text-primary" />
                        Eşleşme Tercihleri
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[400px] px-6 py-2">
                    <div className="space-y-6">

                        {/* Gender Preference */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-primary">
                                <Heart className="w-4 h-4" />
                                <Label className="text-base font-semibold text-white">Cinsiyet Tercihi</Label>
                            </div>
                            <Select
                                value={localFilters.gender}
                                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, gender: value }))}
                            >
                                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white focus:ring-primary/20">
                                    <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                                <SelectContent className="bg-black/90 border-white/10 text-white">
                                    <SelectItem value="all">Farketmez</SelectItem>
                                    <SelectItem value="female">Kadın</SelectItem>
                                    <SelectItem value="male">Erkek</SelectItem>
                                    <SelectItem value="non-binary">Diğer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator className="bg-white/10" />

                        {/* Age Range */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-primary">
                                    <Calendar className="w-4 h-4" />
                                    <Label className="text-base font-semibold text-white">Yaş Aralığı</Label>
                                </div>
                                <span className="text-sm font-medium text-white/70 bg-white/5 px-2 py-0.5 rounded-md">
                                    {localFilters.ageRange[0]} - {localFilters.ageRange[1]}
                                </span>
                            </div>
                            <Slider
                                defaultValue={[18, 50]}
                                value={[localFilters.ageRange[0], localFilters.ageRange[1]]}
                                min={18}
                                max={99}
                                step={1}
                                onValueChange={handleAgeChange}
                                className="py-2"
                            />
                        </div>

                        <Separator className="bg-white/10" />

                        {/* Distance */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-primary">
                                    <MapPin className="w-4 h-4" />
                                    <Label className="text-base font-semibold text-white">Maksimum Mesafe</Label>
                                </div>
                                <span className="text-sm font-medium text-white/70 bg-white/5 px-2 py-0.5 rounded-md">
                                    {localFilters.maxDistance} km
                                </span>
                            </div>
                            <Slider
                                defaultValue={[50]}
                                value={[localFilters.maxDistance]}
                                min={1}
                                max={500}
                                step={1}
                                onValueChange={handleDistanceChange}
                                className="py-2"
                            />
                        </div>

                        <Separator className="bg-white/10" />

                        {/* Zodiac Signs */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-primary">
                                    <Sparkles className="w-4 h-4" />
                                    <Label className="text-base font-semibold text-white">Burçlar</Label>
                                </div>
                                {localFilters.zodiacSigns.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setLocalFilters(prev => ({ ...prev, zodiacSigns: [] }))}
                                        className="h-6 px-2 text-xs text-muted-foreground hover:text-white"
                                    >
                                        Temizle
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {ZODIAC_SIGNS.map((sign) => {
                                    const isSelected = localFilters.zodiacSigns.includes(sign);
                                    return (
                                        <Badge
                                            key={sign}
                                            variant="outline"
                                            className={`cursor-pointer transition-all hover:border-primary/50 ${isSelected
                                                    ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                                                    : "bg-transparent border-white/10 text-white/60 hover:text-white"
                                                }`}
                                            onClick={() => toggleZodiac(sign)}
                                        >
                                            {sign}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>

                        <Separator className="bg-white/10" />

                        {/* Other Options */}
                        <div className="flex items-center justify-between py-2">
                            <Label className="text-white cursor-pointer" htmlFor="has-photo">Sadece fotğraflı profiller</Label>
                            <Switch
                                id="has-photo"
                                checked={localFilters.hasPhoto}
                                onCheckedChange={(checked) => setLocalFilters(prev => ({ ...prev, hasPhoto: checked }))}
                            />
                        </div>

                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-2 bg-black/20 backdrop-blur-sm border-t border-white/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white/50 hover:text-white hover:bg-white/10">
                        İptal
                    </Button>
                    <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-glow px-8">
                        Uygula
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
