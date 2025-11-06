import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface StoryQuestionCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (question: string) => void;
}

export const StoryQuestionCreator = ({ open, onOpenChange, onSave }: StoryQuestionCreatorProps) => {
  const [question, setQuestion] = useState("");

  const handleSave = () => {
    if (!question.trim()) {
      toast.error("Lütfen bir soru girin");
      return;
    }

    onSave(question.trim());
    setQuestion("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Soru Oluştur</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Soru</label>
            <Input
              placeholder="Takipçilerinize sormak istediğiniz soruyu yazın..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {question.length}/150 karakter
            </p>
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
