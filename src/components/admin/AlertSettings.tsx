import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bell, Plus, Trash2, Mail, MessageSquare } from "lucide-react";
import { ManualAlertTest } from "./ManualAlertTest";
import { AlertAnalytics } from "./AlertAnalytics";
import { AlertSnoozeManager } from "./AlertSnoozeManager";
import { AlertEscalationSettings } from "./AlertEscalationSettings";
import { CronJobManager } from "./CronJobManager";

export const AlertSettings = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const alertTypes = [
    { value: 'error', label: 'Hatalar', description: 'Genel uygulama hataları' },
    { value: 'performance', label: 'Performans', description: 'Yavaş sayfa yükleme ve işlemler' },
    { value: 'security', label: 'Güvenlik', description: 'Güvenlik ihlalleri ve tehditleri' },
    { value: 'api', label: 'API', description: 'API çağrı hataları' },
    { value: 'database', label: 'Veritabanı', description: 'Veritabanı bağlantı ve sorgu hataları' },
    { value: 'authentication', label: 'Kimlik Doğrulama', description: 'Giriş ve yetkilendirme hataları' },
  ];

  const [newAlert, setNewAlert] = useState({
    name: '',
    type: 'email' as 'email' | 'slack',
    enabled: true,
    conditions: {
      minSeverity: 'high',
      types: [] as string[],
    },
    recipients: [] as string[],
    recipientInput: '',
    slack_webhook_url: '',
  });

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alert-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_configurations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: logs } = useQuery({
    queryKey: ['alert-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: async (alert: any) => {
      const { data, error } = await supabase
        .from('alert_configurations')
        .insert([{
          name: alert.name,
          type: alert.type,
          enabled: alert.enabled,
          conditions: alert.conditions,
          recipients: alert.recipients,
          slack_webhook_url: alert.slack_webhook_url || null,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-configurations'] });
      toast.success('Alert oluşturuldu');
      setIsAddDialogOpen(false);
      resetNewAlert();
    },
    onError: (error) => {
      toast.error('Alert oluşturulamadı: ' + error.message);
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alert_configurations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-configurations'] });
      toast.success('Alert silindi');
    },
    onError: (error) => {
      toast.error('Alert silinemedi: ' + error.message);
    },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('alert_configurations')
        .update({ enabled })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-configurations'] });
      toast.success('Alert güncellendi');
    },
  });

  const testAlert = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-alert', {
        body: {
          type: 'test',
          severity: 'critical',
          message: 'Bu bir test mesajıdır',
          details: { timestamp: new Date().toISOString() },
        },
      });

      if (error) throw error;
      
      toast.success('Test alert gönderildi! E-postanızı kontrol edin.');
      queryClient.invalidateQueries({ queryKey: ['alert-logs'] });
    } catch (error: any) {
      toast.error('Test alert gönderilemedi: ' + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const resetNewAlert = () => {
    setNewAlert({
      name: '',
      type: 'email',
      enabled: true,
      conditions: { minSeverity: 'high', types: [] },
      recipients: [],
      recipientInput: '',
      slack_webhook_url: '',
    });
  };

  const addRecipient = () => {
    if (newAlert.recipientInput.trim()) {
      setNewAlert({
        ...newAlert,
        recipients: [...newAlert.recipients, newAlert.recipientInput.trim()],
        recipientInput: '',
      });
    }
  };

  const removeRecipient = (index: number) => {
    setNewAlert({
      ...newAlert,
      recipients: newAlert.recipients.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Alert Sistemi
          </h2>
          <p className="text-muted-foreground">
            Kritik hatalar ve performans düşüşleri için bildirimler
          </p>
        </div>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <div className="overflow-x-auto pb-2 mb-4">
          <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-6 bg-card">
            <TabsTrigger value="settings" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Ayarlar</TabsTrigger>
            <TabsTrigger value="analytics" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Analitik</TabsTrigger>
            <TabsTrigger value="snooze" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Sessizleştirme</TabsTrigger>
            <TabsTrigger value="escalation" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Eskalasyon</TabsTrigger>
            <TabsTrigger value="cron" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Cron Jobs</TabsTrigger>
            <TabsTrigger value="test" className="flex-shrink-0 px-4 py-2.5 whitespace-nowrap">Test</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="settings" className="space-y-6">
          <div className="flex gap-2">
            <Button variant="outline" onClick={testAlert} disabled={isTesting}>
              {isTesting ? 'Gönderiliyor...' : 'Test Alert Gönder'}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Alert
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yeni Alert Oluştur</DialogTitle>
                <DialogDescription>
                  Kritik durumlar için otomatik bildirim sistemi
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Alert Adı</Label>
                  <Input
                    id="name"
                    value={newAlert.name}
                    onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                    placeholder="Örn: Kritik Hatalar"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Bildirim Tipi</Label>
                  <Select
                    value={newAlert.type}
                    onValueChange={(value: 'email' | 'slack') => setNewAlert({ ...newAlert, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          E-posta
                        </div>
                      </SelectItem>
                      <SelectItem value="slack">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Slack
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newAlert.type === 'email' && (
                  <div className="space-y-2">
                    <Label>Alıcılar</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newAlert.recipientInput}
                        onChange={(e) => setNewAlert({ ...newAlert, recipientInput: e.target.value })}
                        placeholder="E-posta adresi"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                      />
                      <Button type="button" onClick={addRecipient}>Ekle</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newAlert.recipients.map((email, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {email}
                          <button onClick={() => removeRecipient(index)} className="ml-1">×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {newAlert.type === 'slack' && (
                  <div className="space-y-2">
                    <Label htmlFor="webhook">Slack Webhook URL</Label>
                    <Input
                      id="webhook"
                      value={newAlert.slack_webhook_url}
                      onChange={(e) => setNewAlert({ ...newAlert, slack_webhook_url: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Minimum Severity</Label>
                  <Select
                    value={newAlert.conditions.minSeverity}
                    onValueChange={(value) => setNewAlert({
                      ...newAlert,
                      conditions: { ...newAlert.conditions, minSeverity: value },
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Alert Tipleri</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Hangi tip hatalar için bildirim almak istiyorsunuz? (Boş bırakırsanız tüm tipler için bildirim alırsınız)
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                    {alertTypes.map((type) => (
                      <div key={type.value} className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id={`type-${type.value}`}
                          checked={newAlert.conditions.types.includes(type.value)}
                          onChange={(e) => {
                            const types = e.target.checked
                              ? [...newAlert.conditions.types, type.value]
                              : newAlert.conditions.types.filter(t => t !== type.value);
                            setNewAlert({
                              ...newAlert,
                              conditions: { ...newAlert.conditions, types },
                            });
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor={`type-${type.value}`} className="font-medium cursor-pointer">
                            {type.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {newAlert.conditions.types.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newAlert.conditions.types.map((type) => (
                        <Badge key={type} variant="secondary">
                          {alertTypes.find(t => t.value === type)?.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={newAlert.enabled}
                    onCheckedChange={(checked) => setNewAlert({ ...newAlert, enabled: checked })}
                  />
                  <Label htmlFor="enabled">Aktif</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  İptal
                </Button>
                <Button
                  onClick={() => createAlertMutation.mutate(newAlert)}
                  disabled={
                    !newAlert.name ||
                    (newAlert.type === 'email' && newAlert.recipients.length === 0) ||
                    (newAlert.type === 'slack' && !newAlert.slack_webhook_url)
                  }
                >
                  Oluştur
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
        {alerts?.map((alert) => (
          <Card key={alert.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {alert.type === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                    {alert.name}
                  </CardTitle>
                  <CardDescription>
                    {alert.type === 'email' ? 'E-posta' : 'Slack'} bildirimi
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteAlertMutation.mutate(alert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Durum:</span>
                  <Switch
                    checked={alert.enabled}
                    onCheckedChange={(checked) =>
                      toggleAlertMutation.mutate({ id: alert.id, enabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Min. Severity:</span>
                  <Badge variant="outline">
                    {(alert.conditions as any)?.minSeverity || 'N/A'}
                  </Badge>
                </div>
                {(alert.conditions as any)?.types?.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Alert Tipleri:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {((alert.conditions as any)?.types || []).map((type: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {alertTypes.find(t => t.value === type)?.label || type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {alert.type === 'email' && (
                  <div>
                    <span className="text-sm text-muted-foreground">Alıcılar:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {alert.recipients.map((email: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {logs && logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Son Gönderilen Alertler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{log.type}</div>
                    <div className="text-sm text-muted-foreground">{log.message}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      log.severity === 'critical' ? 'destructive' :
                      log.severity === 'high' ? 'default' :
                      'secondary'
                    }>
                      {log.severity}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(log.sent_at).toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </TabsContent>

      <TabsContent value="analytics">
        <AlertAnalytics />
      </TabsContent>

      <TabsContent value="snooze">
        <AlertSnoozeManager />
      </TabsContent>

        <TabsContent value="escalation">
          <AlertEscalationSettings />
        </TabsContent>

        <TabsContent value="cron">
          <CronJobManager />
        </TabsContent>

        <TabsContent value="test">
          <ManualAlertTest />
        </TabsContent>
      </Tabs>
    </div>
  );
};
