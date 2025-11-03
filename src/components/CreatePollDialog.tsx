import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface CreatePollDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreatePollDialog = ({ isOpen, onClose, onCreated }: CreatePollDialogProps) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [duration, setDuration] = useState("24"); // hours
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = async () => {
    try {
      if (!question.trim()) {
        toast({
          title: "Soru Giriniz",
          description: "Lütfen bir anket sorusu girin.",
          variant: "destructive",
        });
        return;
      }

      const validOptions = options.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        toast({
          title: "Yetersiz Seçenek",
          description: "En az 2 seçenek girmelisiniz.",
          variant: "destructive",
        });
        return;
      }

      setIsCreating(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(duration));

      const pollOptions = validOptions.map((text, index) => ({
        id: `option-${index}`,
        text,
        votes: 0,
      }));

      const { error } = await supabase.from("polls").insert({
        user_id: user.id,
        question: question.trim(),
        options: pollOptions,
        multiple_choice: multipleChoice,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Anket Oluşturuldu",
        description: "Anketiniz başarıyla paylaşıldı.",
      });

      setQuestion("");
      setOptions(["", ""]);
      setMultipleChoice(false);
      onCreated?.();
      onClose();
    } catch (error: any) {
      console.error("Error creating poll:", error);
      toast({
        title: "Hata",
        description: "Anket oluşturulamadı.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Anket Oluştur</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="question">Soru</Label>
            <Input
              id="question"
              placeholder="Anket sorunuzu girin..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
            />
          </div>

          <div>
            <Label>Seçenekler</Label>
            <div className="space-y-2 mt-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Seçenek ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeOption(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-2 w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Seçenek Ekle
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="multiple">Çoklu Seçim</Label>
            <Switch
              id="multiple"
              checked={multipleChoice}
              onCheckedChange={setMultipleChoice}
            />
          </div>

          <div>
            <Label htmlFor="duration">Süre (saat)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="168"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              İptal
            </Button>
            <Button onClick={handleCreate} disabled={isCreating} className="flex-1">
              {isCreating ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};