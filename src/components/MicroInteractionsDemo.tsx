import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InteractiveCard } from "@/components/ui/interactive-card";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Heart, Send, Star } from "lucide-react";

export const MicroInteractionsDemo = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold gradient-text">Micro-Interactions Demo</h1>
        <p className="text-muted-foreground">
          Tüm butonlar, inputlar ve kartlar artık gelişmiş animasyonlara sahip
        </p>
      </div>

      {/* Buttons Section */}
      <InteractiveCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Button Animasyonları
          </CardTitle>
          <CardDescription>
            Ripple efekti, hover glow ve press animasyonları
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>
            <Send className="w-4 h-4" />
            Primary Button
          </Button>
          <Button variant="secondary">
            <Star className="w-4 h-4" />
            Secondary
          </Button>
          <Button variant="destructive">
            <Heart className="w-4 h-4" />
            Destructive
          </Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="lg">Large Button</Button>
          <Button size="sm">Small</Button>
        </CardContent>
      </InteractiveCard>

      {/* Input Section */}
      <InteractiveCard>
        <CardHeader>
          <CardTitle>Input Animasyonları</CardTitle>
          <CardDescription>
            Focus glow, hover border ve smooth transitions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" placeholder="your@email.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea placeholder="Mesajınızı yazın..." />
          </div>
        </CardContent>
      </InteractiveCard>

      {/* Interactive Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <InteractiveCard className="hover-glow">
          <CardHeader>
            <CardTitle className="text-lg">Hover Me</CardTitle>
            <CardDescription>
              Glow effect ile hover
            </CardDescription>
          </CardHeader>
        </InteractiveCard>

        <InteractiveCard pressEffect>
          <CardHeader>
            <CardTitle className="text-lg">Click Me</CardTitle>
            <CardDescription>
              Press efekti ile tıklama
            </CardDescription>
          </CardHeader>
        </InteractiveCard>

        <InteractiveCard hoverGlow pressEffect>
          <CardHeader>
            <CardTitle className="text-lg">Interactive</CardTitle>
            <CardDescription>
              Tüm efektler bir arada
            </CardDescription>
          </CardHeader>
        </InteractiveCard>
      </div>

      {/* Utility Classes Demo */}
      <InteractiveCard>
        <CardHeader>
          <CardTitle>Utility Classes</CardTitle>
          <CardDescription>
            Yeniden kullanılabilir animasyon sınıfları
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 bg-primary/10 rounded-lg hover-scale cursor-pointer">
            .hover-scale - Hover'da büyüme
          </div>
          <div className="p-4 bg-accent/10 rounded-lg hover-lift cursor-pointer">
            .hover-lift - Hover'da yükselme
          </div>
          <div className="p-4 bg-destructive/10 rounded-lg interactive">
            .interactive - Hover + Active efekti
          </div>
          <div className="p-4 bg-success/10 rounded-lg press-effect cursor-pointer">
            .press-effect - Tıklama animasyonu
          </div>
          <div className="p-4 bg-warning/10 rounded-lg pulse-hover cursor-pointer">
            .pulse-hover - Hover'da pulse
          </div>
        </CardContent>
      </InteractiveCard>
    </div>
  );
};
