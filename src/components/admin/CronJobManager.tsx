import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, Pause, Play, Trash2, Plus, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { CronJobHistory } from "./CronJobHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RetrySettings } from "./RetrySettings";
import { AutoScaleSettings } from "./AutoScaleSettings";
import { CronNotificationSettings } from "./CronNotificationSettings";
import { CronJobDashboard } from "./CronJobDashboard";
import { CronJobPerformance } from "./CronJobPerformance";
import { AutoDisableSettings } from "./AutoDisableSettings";

interface CronJob {
  jobid: number;
  schedule: string;
  command: string;
  nodename: string;
  nodeport: number;
  database: string;
  username: string;
  active: boolean;
  jobname: string;
}

export const CronJobManager = () => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  
  const [newJob, setNewJob] = useState({
    jobname: '',
    schedule: '*/5 * * * *',
    command: '',
  });

  const [editSchedule, setEditSchedule] = useState('');

  const { data: cronJobs, isLoading } = useQuery({
    queryKey: ['cron-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('manage-cron-job', {
        body: { action: 'list' }
      });
      
      if (error) throw error;
      return (data?.jobs || []) as CronJob[];
    },
  });

  const unscheduleMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const { data, error } = await supabase.functions.invoke('manage-cron-job', {
        body: { action: 'delete', jobId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
      toast.success('Cron job silindi');
    },
    onError: (error) => {
      toast.error('Cron job silinemedi: ' + error.message);
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (job: typeof newJob) => {
      const { data, error } = await supabase.functions.invoke('manage-cron-job', {
        body: { 
          action: 'create', 
          jobName: job.jobname, 
          schedule: job.schedule, 
          command: job.command 
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
      toast.success('Cron job oluşturuldu');
      setIsCreateDialogOpen(false);
      setNewJob({ jobname: '', schedule: '*/5 * * * *', command: '' });
    },
    onError: (error) => {
      toast.error('Cron job oluşturulamadı: ' + error.message);
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ jobId, schedule }: { jobId: number; schedule: string }) => {
      const { data, error } = await supabase.functions.invoke('manage-cron-job', {
        body: { action: 'update', jobId, schedule }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
      toast.success('Cron job güncellendi');
      setIsEditDialogOpen(false);
      setSelectedJob(null);
    },
    onError: (error) => {
      toast.error('Cron job güncellenemedi: ' + error.message);
    },
  });

  const triggerJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const { data, error } = await supabase.functions.invoke('trigger-cron-job', {
        body: { jobId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-job-logs'] });
      toast.success('Cron job manuel olarak tetiklendi');
    },
    onError: (error) => {
      toast.error('Cron job tetiklenemedi: ' + error.message);
    },
  });

  const handleEditClick = (job: CronJob) => {
    setSelectedJob(job);
    setEditSchedule(job.schedule);
    setIsEditDialogOpen(true);
  };

  const scheduleExamples = [
    { label: 'Her dakika', value: '* * * * *' },
    { label: 'Her 5 dakikada', value: '*/5 * * * *' },
    { label: 'Her 15 dakikada', value: '*/15 * * * *' },
    { label: 'Her saat', value: '0 * * * *' },
    { label: 'Her gün saat 00:00', value: '0 0 * * *' },
    { label: 'Her pazartesi 09:00', value: '0 9 * * 1' },
  ];

  if (isLoading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <Tabs defaultValue="dashboard" className="space-y-6">
      <div className="overflow-x-auto pb-2 mb-4">
        <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-8 bg-card">
          <TabsTrigger value="dashboard" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Dashboard</TabsTrigger>
          <TabsTrigger value="jobs" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Aktif Job'lar</TabsTrigger>
          <TabsTrigger value="history" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Geçmiş</TabsTrigger>
          <TabsTrigger value="performance" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Performans</TabsTrigger>
          <TabsTrigger value="retry" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Retry</TabsTrigger>
          <TabsTrigger value="autoscale" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Ölçeklendirme</TabsTrigger>
          <TabsTrigger value="autodisable" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Oto. Devre Dışı</TabsTrigger>
          <TabsTrigger value="notifications" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Bildirimler</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="dashboard">
        <CronJobDashboard />
      </TabsContent>

      <TabsContent value="jobs" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cron Job Yönetimi
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Zamanlanmış görevleri yönetin ve izleyin
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Cron Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Cron Job Oluştur</DialogTitle>
              <DialogDescription>
                Zamanlanmış bir görev oluşturun
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobname">Job Adı</Label>
                <Input
                  id="jobname"
                  value={newJob.jobname}
                  onChange={(e) => setNewJob({ ...newJob, jobname: e.target.value })}
                  placeholder="check-alerts"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Çalışma Sıklığı (Cron Expression)</Label>
                <Input
                  id="schedule"
                  value={newJob.schedule}
                  onChange={(e) => setNewJob({ ...newJob, schedule: e.target.value })}
                  placeholder="*/5 * * * *"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {scheduleExamples.map((example) => (
                    <Button
                      key={example.value}
                      variant="outline"
                      size="sm"
                      onClick={() => setNewJob({ ...newJob, schedule: example.value })}
                    >
                      {example.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: dakika saat gün ay haftanın_günü
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="command">SQL Komutu</Label>
                <Textarea
                  id="command"
                  value={newJob.command}
                  onChange={(e) => setNewJob({ ...newJob, command: e.target.value })}
                  placeholder="SELECT net.http_post(...);"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                İptal
              </Button>
              <Button
                onClick={() => createJobMutation.mutate(newJob)}
                disabled={!newJob.jobname || !newJob.schedule || !newJob.command}
              >
                Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {cronJobs && cronJobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Henüz cron job bulunmuyor
            </CardContent>
          </Card>
        ) : (
          cronJobs?.map((job) => (
            <Card key={job.jobid}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {job.jobname}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Job ID: {job.jobid}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge variant={job.active ? "default" : "secondary"}>
                      {job.active ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Çalışma Sıklığı:</span>
                    <Badge variant="outline" className="font-mono">
                      {job.schedule}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Komut:</span>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                      {job.command}
                    </pre>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        if (confirm(`"${job.jobname}" job'unu şimdi çalıştırmak istediğinizden emin misiniz?`)) {
                          triggerJobMutation.mutate(job.jobid);
                        }
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Şimdi Çalıştır
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(job)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sıklığı Değiştir
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(`"${job.jobname}" cron job'unu silmek istediğinizden emin misiniz?`)) {
                          unscheduleMutation.mutate(job.jobid);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sil
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Çalışma Sıklığını Değiştir</DialogTitle>
            <DialogDescription>
              {selectedJob?.jobname} için yeni çalışma sıklığı belirleyin
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-schedule">Yeni Çalışma Sıklığı</Label>
              <Input
                id="edit-schedule"
                value={editSchedule}
                onChange={(e) => setEditSchedule(e.target.value)}
                placeholder="*/5 * * * *"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {scheduleExamples.map((example) => (
                  <Button
                    key={example.value}
                    variant="outline"
                    size="sm"
                    onClick={() => setEditSchedule(example.value)}
                  >
                    {example.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() => {
                if (selectedJob) {
                  updateJobMutation.mutate({ 
                    jobId: selectedJob.jobid, 
                    schedule: editSchedule 
                  });
                }
              }}
              disabled={!editSchedule}
            >
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </TabsContent>

      <TabsContent value="history">
        <CronJobHistory />
      </TabsContent>

      <TabsContent value="retry">
        <RetrySettings />
      </TabsContent>

      <TabsContent value="autoscale">
        <AutoScaleSettings />
      </TabsContent>

      <TabsContent value="performance">
        <CronJobPerformance />
      </TabsContent>

      <TabsContent value="autodisable">
        <AutoDisableSettings />
      </TabsContent>

      <TabsContent value="notifications">
        <CronNotificationSettings />
      </TabsContent>
    </Tabs>
  );
};
