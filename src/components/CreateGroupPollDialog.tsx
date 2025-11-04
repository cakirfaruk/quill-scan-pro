import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Loader2 } from "lucide-react";

interface CreateGroupPollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onPollCreated: () => void;
}

export const CreateGroupPollDialog = ({
  open,
  onOpenChange,
  groupId,
  onPollCreated,
}: CreateGroupPollDialogProps) => {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [duration, setDuration] = useState("24"); // hours
  const [creating, setCreating] = useState(false);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = async () => {
    // Validation
    if (!question.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen bir soru girin",
        variant: "destructive",
      });
      return;
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Hata",
        description: "En az 2 seçenek gerekli",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(duration));

      // Format options as JSONB
      const formattedOptions = validOptions.map((text, index) => ({
        id: `option-${index}`,
        text: text.trim(),
      }));

      const { error } = await supabase.from("group_polls").insert({
        group_id: groupId,
        created_by: user.id,
        question: question.trim(),
        options: formattedOptions,
        multiple_choice: multipleChoice,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Anket oluşturuldu",
      });

      // Reset form
      setQuestion("");
      setOptions(["", ""]);
      setMultipleChoice(false);
      setDuration("24");
      onOpenChange(false);
      onPollCreated();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Anket oluşturulamadı",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Anket Oluştur</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Question */}
          <div>
            <Label htmlFor="question">Soru</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Sorunuzu yazın..."
              maxLength={200}
            />
          </div>

          {/* Options */}
          <div>
            <Label>Seçenekler</Label>
            <div className="space-y-2 mt-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Seçenek ${index + 1}`}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="mt-2 w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Seçenek Ekle
              </Button>
            )}
          </div>

          {/* Multiple Choice */}
          <div className="flex items-center justify-between">
            <Label htmlFor="multiple-choice">Çoklu Seçim</Label>
            <Switch
              id="multiple-choice"
              checked={multipleChoice}
              onCheckedChange={setMultipleChoice}
            />
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration">Süre (saat)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1"
              max="168"
            />
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreatePoll}
            disabled={creating}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              "Anketi Oluştur"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
