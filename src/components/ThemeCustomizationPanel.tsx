import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useThemeSettings } from "@/hooks/use-theme-settings";
import { Type, CornerRightDown, Zap, Palette, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT_COLORS = [
  { name: "Mavi", value: "210 100% 50%", color: "hsl(210 100% 50%)" },
  { name: "Mor", value: "271 81% 56%", color: "hsl(271 81% 56%)" },
  { name: "Pembe", value: "346 77% 50%", color: "hsl(346 77% 50%)" },
  { name: "Turuncu", value: "25 95% 53%", color: "hsl(25 95% 53%)" },
  { name: "Yeşil", value: "142 76% 36%", color: "hsl(142 76% 36%)" },
  { name: "Turkuaz", value: "199 89% 48%", color: "hsl(199 89% 48%)" },
];

const PRIMARY_COLORS = [
  { name: "Lacivert", value: "217 91% 35%", color: "hsl(217 91% 35%)" },
  { name: "Mor", value: "271 81% 40%", color: "hsl(271 81% 40%)" },
  { name: "Koyu Pembe", value: "340 82% 42%", color: "hsl(340 82% 42%)" },
  { name: "Turuncu", value: "20 90% 48%", color: "hsl(20 90% 48%)" },
  { name: "Yeşil", value: "142 71% 32%", color: "hsl(142 71% 32%)" },
  { name: "Mavi", value: "199 89% 40%", color: "hsl(199 89% 40%)" },
];

export const ThemeCustomizationPanel = () => {
  const { settings, updateSettings, resetSettings } = useThemeSettings();

  return (
    <div className="space-y-6">
      {/* Font Size */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Font Boyutu</CardTitle>
            </div>
          </div>
          <CardDescription>
            Metin boyutunu tercihlerinize göre ayarlayın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.fontSize}
            onValueChange={(value) =>
              updateSettings({ fontSize: value as "small" | "medium" | "large" })
            }
          >
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "small", label: "Küçük", demo: "text-sm" },
                { value: "medium", label: "Orta", demo: "text-base" },
                { value: "large", label: "Büyük", demo: "text-lg" },
              ].map((option) => (
                <label
                  key={option.value}
                  htmlFor={`font-${option.value}`}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all",
                    settings.fontSize === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`font-${option.value}`}
                    className="sr-only"
                  />
                  <span className={cn("font-semibold mb-1", option.demo)}>Aa</span>
                  <span className="text-xs text-muted-foreground">{option.label}</span>
                </label>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CornerRightDown className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Köşe Yuvarlaklığı</CardTitle>
          </div>
          <CardDescription>
            Köşelerin yuvarlaklık derecesini belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.borderRadius}
            onValueChange={(value) =>
              updateSettings({ borderRadius: value as "sharp" | "default" | "round" })
            }
          >
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "sharp", label: "Keskin", radius: "rounded-sm" },
                { value: "default", label: "Varsayılan", radius: "rounded-lg" },
                { value: "round", label: "Yuvarlak", radius: "rounded-2xl" },
              ].map((option) => (
                <label
                  key={option.value}
                  htmlFor={`radius-${option.value}`}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all",
                    settings.borderRadius === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`radius-${option.value}`}
                    className="sr-only"
                  />
                  <div className={cn("w-12 h-12 bg-primary/20 mb-2", option.radius)} />
                  <span className="text-xs text-muted-foreground">{option.label}</span>
                </label>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Primary Color */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Ana Renk</CardTitle>
          </div>
          <CardDescription>
            Uygulamanın ana renk temasını seçin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {PRIMARY_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => updateSettings({ primaryColor: color.value })}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all",
                  settings.primaryColor === color.value
                    ? "border-primary shadow-glow"
                    : "border-border hover:border-border/60"
                )}
              >
                <div
                  className="w-12 h-12 rounded-full mb-2 shadow-md"
                  style={{ backgroundColor: color.color }}
                />
                <span className="text-xs text-muted-foreground">{color.name}</span>
                {settings.primaryColor === color.value && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Vurgu Rengi</CardTitle>
          </div>
          <CardDescription>
            Butonlar ve etkileşimli öğeler için renk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => updateSettings({ accentColor: color.value })}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all",
                  settings.accentColor === color.value
                    ? "border-primary shadow-glow"
                    : "border-border hover:border-border/60"
                )}
              >
                <div
                  className="w-12 h-12 rounded-full mb-2 shadow-md"
                  style={{ backgroundColor: color.color }}
                />
                <span className="text-xs text-muted-foreground">{color.name}</span>
                {settings.accentColor === color.value && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Animation Speed */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Animasyon Hızı</CardTitle>
          </div>
          <CardDescription>
            Geçiş efektlerinin hızını ayarlayın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.animationSpeed}
            onValueChange={(value) =>
              updateSettings({ animationSpeed: value as "slow" | "normal" | "fast" })
            }
          >
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "slow", label: "Yavaş" },
                { value: "normal", label: "Normal" },
                { value: "fast", label: "Hızlı" },
              ].map((option) => (
                <label
                  key={option.value}
                  htmlFor={`speed-${option.value}`}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all",
                    settings.animationSpeed === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`speed-${option.value}`}
                    className="sr-only"
                  />
                  <Zap className="w-6 h-6 mb-2 text-primary" />
                  <span className="text-xs text-muted-foreground">{option.label}</span>
                </label>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={resetSettings}
          >
            <RotateCcw className="w-4 h-4" />
            Varsayılan Ayarlara Dön
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
