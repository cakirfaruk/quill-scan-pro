import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface StoryTextEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (textData: {
    text: string;
    font: string;
    color: string;
    size: number;
    animation: string;
  }) => void;
}

const fonts = [
  { value: "sans", label: "Sans Serif" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Monospace" },
  { value: "cursive", label: "Cursive" },
];

const animations = [
  { value: "none", label: "Yok" },
  { value: "fade", label: "Fade" },
  { value: "slide", label: "Slide" },
  { value: "bounce", label: "Bounce" },
  { value: "zoom", label: "Zoom" },
];

const colors = [
  "#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF", 
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080"
];

export const StoryTextEditor = ({ open, onOpenChange, onSave }: StoryTextEditorProps) => {
  const [text, setText] = useState("");
  const [font, setFont] = useState("sans");
  const [color, setColor] = useState("#FFFFFF");
  const [size, setSize] = useState(24);
  const [animation, setAnimation] = useState("none");

  const handleSave = () => {
    if (!text.trim()) return;
    onSave({ text, font, color, size, animation });
    setText("");
    setFont("sans");
    setColor("#FFFFFF");
    setSize(24);
    setAnimation("none");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Metin Ekle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Metin</Label>
            <Input
              placeholder="Metninizi yazın..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={100}
            />
          </div>

          <div>
            <Label>Yazı Tipi</Label>
            <Select value={font} onValueChange={setFont}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fonts.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Renk</Label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === c ? "border-primary" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Boyut: {size}px</Label>
            <Slider
              value={[size]}
              onValueChange={([value]) => setSize(value)}
              min={16}
              max={72}
              step={2}
            />
          </div>

          <div>
            <Label>Animasyon</Label>
            <Select value={animation} onValueChange={setAnimation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {animations.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-black min-h-[100px] flex items-center justify-center">
            <p
              style={{
                fontFamily: font,
                color: color,
                fontSize: `${size}px`,
              }}
            >
              {text || "Önizleme"}
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={!text.trim()}>
              Ekle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
