import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShieldOff, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface CronJob {
  id: number;
  name: string;
  enabled: boolean;
  auto_disable_enabled: boolean;
  failure_threshold: number;
  failure_window_minutes: number;
  disabled_at: string | null;
  disabled_reason: string | null;
}

export const AutoDisableSettings = () => {
  const queryClient = useQueryClient();
  const [editingJob, setEditingJob] = useState<number | null>(null);
  const [settings, setSettings] = useState<{
    autoDisableEnabled: boolean;
    failureThreshold: number;
    failureWindowMinutes: number;
  }>({
    autoDisableEnabled: false,
    failureThreshold: 5,
    failureWindowMinutes: 60,
  });

  const { data: cronJobs, isLoading } = useQuery({
    queryKey: ['cron-jobs-auto-disable'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cron_jobs')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as CronJob[];
    },
    refetchInterval: 30000,
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ jobId, updates }: { jobId: number; updates: Partial<CronJob> }) => {
      const { error } = await supabase
        .from('cron_jobs')
        .update(updates)
        .eq('id', jobId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs-auto-disable'] });
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
      toast.success('Ayarlar güncellendi');
      setEditingJob(null);
    },
    onError: (error) => {
      toast.error('Güncelleme başarısız: ' + error.message);
    },
  });

  const reEnableJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const { error } = await supabase
        .from('cron_jobs')
        .update({
          enabled: true,
          disabled_at: null,
          disabled_reason: null,
        })
        .eq('id', jobId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs-auto-disable'] });
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
      toast.success('Job tekrar aktif edildi');
    },
    onError: (error) => {
      toast.error('Job aktif edilemedi: ' + error.message);
    },
  });

  const handleEditJob = (job: CronJob) => {
    setEditingJob(job.id);
    setSettings({
      autoDisableEnabled: job.auto_disable_enabled,
      failureThreshold: job.failure_threshold,
      failureWindowMinutes: job.failure_window_minutes,
    });
  };

  const handleSaveJob = (jobId: number) => {
    updateJobMutation.mutate({
      jobId,
      updates: {
        auto_disable_enabled: settings.autoDisableEnabled,
        failure_threshold: settings.failureThreshold,
        failure_window_minutes: settings.failureWindowMinutes,
      },
    });
  };

  const disabledJobs = cronJobs?.filter(job => job.disabled_at !== null) || [];
  const activeJobs = cronJobs?.filter(job => job.disabled_at === null) || [];

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
    <div className="space-y-6">
      {/* Devre Dışı Bırakılan Job'lar */}
      {disabledJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Otomatik Devre Dışı Bırakılan Job'lar
            </CardTitle>
            <CardDescription>
              Bu job'lar başarısızlık eşiğine ulaştığı için otomatik olarak devre dışı bırakıldı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {disabledJobs.map((job) => (
                  <Card key={job.id} className="border-destructive/50">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold flex items-center gap-2">
                              {job.name}
                              <Badge variant="destructive">Devre Dışı</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {job.disabled_at && formatDistanceToNow(new Date(job.disabled_at), {
                                addSuffix: true,
                                locale: tr,
                              })}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm(`"${job.name}" job'unu tekrar aktif etmek istediğinizden emin misiniz?`)) {
                                reEnableJobMutation.mutate(job.id);
                              }
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Tekrar Aktif Et
                          </Button>
                        </div>
                        
                        {job.disabled_reason && (
                          <div className="p-3 bg-destructive/10 rounded text-sm">
                            <div className="font-semibold text-destructive mb-1">Sebep:</div>
                            <div className="text-muted-foreground">{job.disabled_reason}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Aktif Job'lar için Ayarlar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5" />
            Otomatik Devre Dışı Bırakma Ayarları
          </CardTitle>
          <CardDescription>
            Her job için otomatik devre dışı bırakma kurallarını yapılandırın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Bilgilendirme */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 text-sm">
                  <div className="font-semibold mb-1">Nasıl Çalışır?</div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Belirlenen zaman penceresinde eşik sayısı kadar başarısızlık olursa job otomatik devre dışı bırakılır</li>
                    <li>• Devre dışı bırakıldığında size bildirim gönderilir</li>
                    <li>• Job'u yukarıdaki listeden tekrar aktif edebilirsiniz</li>
                    <li>• Her job için farklı eşik değerleri ayarlayabilirsiniz</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Job Listesi */}
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold flex items-center gap-2">
                              {job.name}
                              {job.enabled ? (
                                <Badge variant="default">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Aktif
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Pasif</Badge>
                              )}
                            </div>
                            {job.auto_disable_enabled && (
                              <div className="text-sm text-muted-foreground mt-1">
                                Eşik: {job.failure_threshold} başarısızlık / {job.failure_window_minutes} dakika
                              </div>
                            )}
                          </div>
                          
                          {editingJob !== job.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditJob(job)}
                            >
                              Düzenle
                            </Button>
                          )}
                        </div>

                        {editingJob === job.id && (
                          <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>Otomatik Devre Dışı Bırakma</Label>
                                <p className="text-sm text-muted-foreground">
                                  Bu job için otomatik devre dışı bırakmayı etkinleştir
                                </p>
                              </div>
                              <Switch
                                checked={settings.autoDisableEnabled}
                                onCheckedChange={(checked) =>
                                  setSettings({ ...settings, autoDisableEnabled: checked })
                                }
                              />
                            </div>

                            {settings.autoDisableEnabled && (
                              <>
                                <div className="space-y-2">
                                  <Label>Başarısızlık Eşiği</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={settings.failureThreshold}
                                    onChange={(e) =>
                                      setSettings({
                                        ...settings,
                                        failureThreshold: parseInt(e.target.value) || 1,
                                      })
                                    }
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Kaç başarısızlıktan sonra devre dışı bırakılacak
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <Label>Zaman Penceresi (Dakika)</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={settings.failureWindowMinutes}
                                    onChange={(e) =>
                                      setSettings({
                                        ...settings,
                                        failureWindowMinutes: parseInt(e.target.value) || 1,
                                      })
                                    }
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Bu süre içinde başarısızlıklar sayılacak
                                  </p>
                                </div>
                              </>
                            )}

                            <div className="flex gap-2">
                              <Button onClick={() => handleSaveJob(job.id)}>
                                Kaydet
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setEditingJob(null)}
                              >
                                İptal
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};