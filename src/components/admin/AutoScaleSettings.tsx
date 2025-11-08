import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Activity, Settings2, Play } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CronJob {
  id: number;
  name: string;
  auto_scale_enabled: boolean;
  min_interval_seconds: number;
  max_interval_seconds: number;
  current_interval_seconds: number;
  success_rate_threshold_high: number;
  success_rate_threshold_low: number;
  last_scale_check_at: string | null;
}

export const AutoScaleSettings = () => {
  const queryClient = useQueryClient();
  const [editingJob, setEditingJob] = useState<number | null>(null);
  const [settings, setSettings] = useState<Partial<CronJob>>({});

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['cron-jobs-autoscale'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cron_jobs')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as CronJob[];
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<CronJob> }) => {
      const { error } = await supabase
        .from('cron_jobs')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs-autoscale'] });
      toast.success('Ayarlar güncellendi');
      setEditingJob(null);
      setSettings({});
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message);
    },
  });

  const runAutoScaleMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('auto-scale-cron-jobs');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs-autoscale'] });
      if (data.scaled?.length > 0) {
        toast.success(`${data.scaled.length} job ölçeklendirildi`);
      } else {
        toast.info('Ölçeklendirme gerektiren job bulunamadı');
      }
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message);
    },
  });

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds}sn`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}dk`;
    return `${Math.floor(seconds / 3600)}sa`;
  };

  const formatLastCheck = (timestamp: string | null) => {
    if (!timestamp) return 'Hiç kontrol edilmedi';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${Math.floor(diffHours / 24)} gün önce`;
  };

  const handleEdit = (job: CronJob) => {
    setEditingJob(job.id);
    setSettings({
      auto_scale_enabled: job.auto_scale_enabled,
      min_interval_seconds: job.min_interval_seconds,
      max_interval_seconds: job.max_interval_seconds,
      success_rate_threshold_high: job.success_rate_threshold_high,
      success_rate_threshold_low: job.success_rate_threshold_low,
    });
  };

  const handleSave = (jobId: number) => {
    updateJobMutation.mutate({ id: jobId, updates: settings });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Yükleniyor...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Otomatik Ölçeklendirme
              </CardTitle>
              <CardDescription>
                Başarı oranına göre cron job sıklığını otomatik ayarla
              </CardDescription>
            </div>
            <Button
              onClick={() => runAutoScaleMutation.mutate()}
              disabled={runAutoScaleMutation.isPending}
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Manuel Kontrol
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!jobs || jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz cron job tanımlanmamış
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {jobs.map((job) => {
                  const isEditing = editingJob === job.id;
                  const currentSettings = isEditing ? settings : job;

                  return (
                    <Card key={job.id} className="border-l-4" style={{
                      borderLeftColor: job.auto_scale_enabled 
                        ? 'hsl(var(--primary))' 
                        : 'hsl(var(--muted))'
                    }}>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{job.name}</h3>
                                {job.auto_scale_enabled ? (
                                  <Badge variant="default">Aktif</Badge>
                                ) : (
                                  <Badge variant="secondary">Pasif</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Son kontrol: {formatLastCheck(job.last_scale_check_at)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => isEditing ? handleSave(job.id) : handleEdit(job)}
                            >
                              <Settings2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`auto-scale-${job.id}`}>
                                Otomatik Ölçeklendirme
                              </Label>
                              <Switch
                                id={`auto-scale-${job.id}`}
                                checked={currentSettings.auto_scale_enabled ?? false}
                                onCheckedChange={(checked) => {
                                  if (isEditing) {
                                    setSettings({ ...settings, auto_scale_enabled: checked });
                                  } else {
                                    updateJobMutation.mutate({
                                      id: job.id,
                                      updates: { auto_scale_enabled: checked }
                                    });
                                  }
                                }}
                                disabled={updateJobMutation.isPending}
                              />
                            </div>

                            {(isEditing || job.auto_scale_enabled) && (
                              <>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <Label className="text-xs">Min Aralık</Label>
                                    <div className="flex items-center gap-2">
                                      {isEditing ? (
                                        <Input
                                          type="number"
                                          value={currentSettings.min_interval_seconds}
                                          onChange={(e) => setSettings({
                                            ...settings,
                                            min_interval_seconds: parseInt(e.target.value)
                                          })}
                                          className="h-8"
                                        />
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <TrendingUp className="h-3 w-3 text-primary" />
                                          <span className="font-medium">
                                            {formatInterval(job.min_interval_seconds)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-xs">Mevcut</Label>
                                    <div className="flex items-center gap-1">
                                      <Activity className="h-3 w-3 text-muted-foreground" />
                                      <span className="font-medium">
                                        {formatInterval(job.current_interval_seconds)}
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-xs">Max Aralık</Label>
                                    <div className="flex items-center gap-2">
                                      {isEditing ? (
                                        <Input
                                          type="number"
                                          value={currentSettings.max_interval_seconds}
                                          onChange={(e) => setSettings({
                                            ...settings,
                                            max_interval_seconds: parseInt(e.target.value)
                                          })}
                                          className="h-8"
                                        />
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <TrendingDown className="h-3 w-3 text-destructive" />
                                          <span className="font-medium">
                                            {formatInterval(job.max_interval_seconds)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs">Yüksek Eşik (%)</Label>
                                    {isEditing ? (
                                      <Input
                                        type="number"
                                        value={currentSettings.success_rate_threshold_high}
                                        onChange={(e) => setSettings({
                                          ...settings,
                                          success_rate_threshold_high: parseFloat(e.target.value)
                                        })}
                                        className="h-8"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                      />
                                    ) : (
                                      <div className="text-sm font-medium text-primary">
                                        {job.success_rate_threshold_high}%
                                      </div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Bu değerin üstünde → daha sık çalışır
                                    </p>
                                  </div>

                                  <div>
                                    <Label className="text-xs">Düşük Eşik (%)</Label>
                                    {isEditing ? (
                                      <Input
                                        type="number"
                                        value={currentSettings.success_rate_threshold_low}
                                        onChange={(e) => setSettings({
                                          ...settings,
                                          success_rate_threshold_low: parseFloat(e.target.value)
                                        })}
                                        className="h-8"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                      />
                                    ) : (
                                      <div className="text-sm font-medium text-destructive">
                                        {job.success_rate_threshold_low}%
                                      </div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Bu değerin altında → daha az çalışır
                                    </p>
                                  </div>
                                </div>

                                {isEditing && (
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      onClick={() => handleSave(job.id)}
                                      disabled={updateJobMutation.isPending}
                                      size="sm"
                                    >
                                      Kaydet
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingJob(null);
                                        setSettings({});
                                      }}
                                      size="sm"
                                    >
                                      İptal
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">Otomatik Ölçeklendirme Nasıl Çalışır?</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Son 20 çalışma başarı oranına göre değerlendirilir</li>
              <li>• <strong>Yüksek başarı oranı</strong>: Job daha sık çalışır (min aralığa kadar)</li>
              <li>• <strong>Düşük başarı oranı</strong>: Job daha az çalışır (max aralığa kadar)</li>
              <li>• Her ayarlama %20 azalma veya %50 artış şeklinde yapılır</li>
              <li>• Sistemin öğrenmesi için en az 5 çalışma gerekir</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
