import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Heart, MessageCircle, Share2, TrendingUp, Users, Calendar, Loader2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface PostInsightsDialogProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PostInsightsDialog = ({ postId, isOpen, onClose }: PostInsightsDialogProps) => {
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadInsights();
    }
  }, [isOpen, postId]);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      // Get post views
      const { data: viewsData } = await supabase
        .from("post_views")
        .select("created_at, user_id")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      // Get likes
      const { data: likesData } = await supabase
        .from("post_likes")
        .select("created_at, user_id")
        .eq("post_id", postId);

      // Get comments
      const { data: commentsData } = await supabase
        .from("post_comments")
        .select("created_at, user_id")
        .eq("post_id", postId);

      // Get shares (from posts table)
      const { data: postData } = await supabase
        .from("posts")
        .select("shares_count, created_at")
        .eq("id", postId)
        .single();

      // Calculate engagement rate
      const totalViews = viewsData?.length || 0;
      const totalLikes = likesData?.length || 0;
      const totalComments = commentsData?.length || 0;
      const totalShares = postData?.shares_count || 0;
      const totalEngagements = totalLikes + totalComments + totalShares;
      const engagementRate = totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(1) : 0;

      // Group views by day for chart
      const viewsByDay = (viewsData || []).reduce((acc: any, view: any) => {
        const day = new Date(view.created_at).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(viewsByDay).map(([day, count]) => ({
        day,
        views: count,
      }));

      // Get unique viewers
      const uniqueViewers = new Set((viewsData || []).map((v: any) => v.user_id)).size;

      setInsights({
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        engagementRate,
        uniqueViewers,
        chartData,
        createdAt: postData?.created_at,
      });
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Gönderi İstatistikleri
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <Eye className="w-8 h-8 text-blue-500 mb-2" />
                    <p className="text-2xl font-bold">{insights.totalViews}</p>
                    <p className="text-sm text-muted-foreground">Görüntülenme</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <Heart className="w-8 h-8 text-red-500 mb-2" />
                    <p className="text-2xl font-bold">{insights.totalLikes}</p>
                    <p className="text-sm text-muted-foreground">Beğeni</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <MessageCircle className="w-8 h-8 text-green-500 mb-2" />
                    <p className="text-2xl font-bold">{insights.totalComments}</p>
                    <p className="text-sm text-muted-foreground">Yorum</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <Share2 className="w-8 h-8 text-purple-500 mb-2" />
                    <p className="text-2xl font-bold">{insights.totalShares}</p>
                    <p className="text-sm text-muted-foreground">Paylaşım</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Engagement Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Etkileşim Analizi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm">Etkileşim Oranı</span>
                  </div>
                  <span className="font-semibold">{insights.engagementRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm">Benzersiz Görüntüleyici</span>
                  </div>
                  <span className="font-semibold">{insights.uniqueViewers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm">Yayın Tarihi</span>
                  </div>
                  <span className="font-semibold text-sm">
                    {new Date(insights.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Views Chart */}
            {insights.chartData && insights.chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Görüntülenme Trendi</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={insights.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" style={{ fontSize: '12px' }} />
                      <YAxis style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="views" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Button onClick={onClose} className="w-full">
              Kapat
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
