import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function TrendingHashtags() {
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTrendingHashtags();
  }, []);

  const loadTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from("hashtags")
        .select("*")
        .order("usage_count", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHashtags(data || []);
    } catch (error) {
      console.error("Error loading trending hashtags:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Trend Etiketler</h1>
            <p className="text-sm text-muted-foreground">
              En çok kullanılan hashtag'ler
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {hashtags.map((hashtag, index) => (
            <motion.div
              key={hashtag.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                onClick={() => navigate(`/explore?hashtag=${hashtag.tag}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-full text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Hash className="w-4 h-4 text-primary" />
                          {hashtag.tag}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {hashtag.usage_count.toLocaleString()} gönderi
                        </p>
                      </div>
                    </div>
                    {index < 3 && (
                      <Badge variant="default" className="bg-gradient-primary">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Top {index + 1}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
