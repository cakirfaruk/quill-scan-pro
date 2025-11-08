import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { RotateCw, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const RetrySettings = () => {
  const queryClient = useQueryClient();
  const [isManualRetrying, setIsManualRetrying] = useState(false);

  const { data: retryStats } = useQuery({
    queryKey: ['retry-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cron_job_logs')
        .select('status, retry_count, max_retries')
        .eq('status', 'failed');
      
      if (error) throw error;
      
      const totalFailed = data?.length || 0;
      const retriableFailed = data?.filter(log => log.retry_count < log.max_retries).length || 0;
      const maxedOut = data?.filter(log => log.retry_count >= log.max_retries).length || 0;
      
      return {
        totalFailed,
        retriableFailed,
        maxedOut
      };
    },
    refetchInterval: 30000,
  });

  const manualRetryMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('retry-failed-cron-jobs');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cron-job-logs'] });
      queryClient.invalidateQueries({ queryKey: ['retry-stats'] });
      toast.success(`${data.retriedCount} job yeniden deneme için zamanlandı`);
    },
    onError: (error) => {
      toast.error('Yeniden deneme başlatılamadı: ' + error.message);
    },
  });

  const handleManualRetry = async () => {
    setIsManualRetrying(true);
    try {
      await manualRetryMutation.mutateAsync();
    } finally {
      setIsManualRetrying(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Otomatik Yeniden Deneme Ayarları
          </CardTitle>
          <CardDescription>
            Başarısız cron job'lar için otomatik retry mekanizması
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Toplam Başarısız
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{retryStats?.totalFailed || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Yeniden Denenebilir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {retryStats?.retriableFailed || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Maksimum Denemeye Ulaşan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {retryStats?.maxedOut || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Retry Politikası</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Maksimum Deneme:</span>
                  <Badge variant="outline">3 kez</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Başlangıç Gecikme:</span>
                  <Badge variant="outline">60 saniye</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Backoff Stratejisi:</span>
                  <Badge variant="outline">Exponential (2x)</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Otomatik Kontrol:</span>
                  <Badge variant="outline">Her 2 dakikada</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-medium">Retry Zaman Çizelgesi</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 1. deneme: 60 saniye sonra</li>
                <li>• 2. deneme: 120 saniye sonra (2 dakika)</li>
                <li>• 3. deneme: 240 saniye sonra (4 dakika)</li>
                <li>• 3 denemeden sonra: Kalıcı başarısızlık olarak işaretlenir</li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-4">
            <Button
              onClick={handleManualRetry}
              disabled={isManualRetrying || !retryStats?.retriableFailed}
              className="w-full"
              variant="default"
            >
              <RotateCw className={`h-4 w-4 mr-2 ${isManualRetrying ? 'animate-spin' : ''}`} />
              {isManualRetrying 
                ? 'Yeniden deneniyor...' 
                : `Tüm Başarısızları Yeniden Dene (${retryStats?.retriableFailed || 0})`}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Bu işlem tüm yeniden denenebilir başarısız job'ları hemen retry için zamanlar
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
