import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface StoryPollCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (poll: { question: string; options: string[] }) => void;
}

export const StoryPollCreator = ({ open, onOpenChange, onSave }: StoryPollCreatorProps) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, ""]);
    } else {
      toast.error("En fazla 4 seçenek ekleyebilirsiniz");
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    } else {
      toast.error("En az 2 seçenek olmalıdır");
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSave = () => {
    if (!question.trim()) {
      toast.error("Lütfen bir soru girin");
      return;
    }

    const filledOptions = options.filter(opt => opt.trim());
    if (filledOptions.length < 2) {
      toast.error("En az 2 seçenek doldurulmalıdır");
      return;
    }

    onSave({ question: question.trim(), options: filledOptions });
    setQuestion("");
    setOptions(["", ""]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anket Oluştur</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Soru</label>
            <Input
              placeholder="Sorunuzu yazın..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={100}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Seçenekler</label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Seçenek ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    maxLength={50}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={handleAddOption}
              >
                <Plus className="h-4 w-4 mr-2" />
                Seçenek Ekle
              </Button>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              Kaydet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
