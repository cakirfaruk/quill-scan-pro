import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, EyeOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HiddenWordsSettingsProps {
  userId: string;
}

export const HiddenWordsSettings = ({ userId }: HiddenWordsSettingsProps) => {
  const { toast } = useToast();
  const [words, setWords] = useState<{ id: string; word: string }[]>([]);
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadHiddenWords();
  }, [userId]);

  const loadHiddenWords = async () => {
    try {
      const { data, error } = await supabase
        .from("hidden_words")
        .select("id, word")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWords(data || []);
    } catch (error) {
      console.error("Error loading hidden words:", error);
    } finally {
      setLoading(false);
    }
  };

  const addWord = async () => {
    const trimmedWord = newWord.trim().toLowerCase();
    if (!trimmedWord) return;

    if (words.some((w) => w.word === trimmedWord)) {
      toast({
        title: "Kelime Zaten Mevcut",
        description: "Bu kelime zaten listenizde var.",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from("hidden_words")
        .insert({ user_id: userId, word: trimmedWord })
        .select()
        .single();

      if (error) throw error;

      setWords([{ id: data.id, word: data.word }, ...words]);
      setNewWord("");
      toast({
        title: "Kelime Eklendi",
        description: `"${trimmedWord}" engellenen kelimeler listesine eklendi.`,
      });
    } catch (error) {
      console.error("Error adding word:", error);
      toast({
        title: "Hata",
        description: "Kelime eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const removeWord = async (id: string, word: string) => {
    try {
      const { error } = await supabase.from("hidden_words").delete().eq("id", id);

      if (error) throw error;

      setWords(words.filter((w) => w.id !== id));
      toast({
        title: "Kelime Silindi",
        description: `"${word}" engellenen kelimeler listesinden silindi.`,
      });
    } catch (error) {
      console.error("Error removing word:", error);
      toast({
        title: "Hata",
        description: "Kelime silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !adding) {
      addWord();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <EyeOff className="w-5 h-5" />
          Engellenen Kelimeler
        </CardTitle>
        <CardDescription>
          Bu kelimeleri içeren mesajlar size gösterilmeden önce filtrelenir
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new word */}
        <div className="flex gap-2">
          <Input
            placeholder="Engellenecek kelime..."
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={addWord} disabled={adding || !newWord.trim()} size="icon">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        {/* Word list */}
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {words.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 gap-1 cursor-default group"
                >
                  {item.word}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 hover:bg-destructive/20 rounded-full"
                    onClick={() => removeWord(item.id, item.word)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {words.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Henüz engellenen kelime yok. Yukarıdaki alandan kelime ekleyebilirsiniz.
          </p>
        )}

        {words.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {words.length} kelime engellendi
          </p>
        )}
      </CardContent>
    </Card>
  );
};
