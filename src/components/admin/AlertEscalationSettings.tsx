import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { TrendingUp, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface EscalationConfig {
  id: string;
  name: string;
  enabled: boolean;
  severity_levels: string[];
  alert_types: string[] | null;
  escalation_delay_minutes: number;
  escalation_levels: EscalationLevel[];
}

interface EscalationLevel {
  type: string;
  recipients: string[];
  message?: string;
}

interface AlertLog {
  id: string;
  type: string;
  severity: string;
  message: string;
  sent_at: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

const alertTypes = [
  { value: 'error', label: 'Hatalar' },
  { value: 'performance', label: 'Performans' },
  { value: 'security', label: 'Güvenlik' },
  { value: 'api', label: 'API' },
  { value: 'database', label: 'Veritabanı' },
  { value: 'authentication', label: 'Kimlik Doğrulama' },
];

const severityLevels = [
  { value: 'critical', label: 'Critical', color: 'destructive' },
  { value: 'high', label: 'High', color: 'default' },
  { value: 'medium', label: 'Medium', color: 'secondary' },
];

export function AlertEscalationSettings() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEscalation, setNewEscalation] = useState({
    name: '',
    enabled: true,
    severity_levels: ['critical'] as string[],
    alert_types: [] as string[],
    escalation_delay_minutes: 30,
    escalation_levels: [{ type: 'email', recipients: [] as string[], message: '' }],
  });

  const { data: escalations, isLoading } = useQuery({
    queryKey: ['alert-escalations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_escalations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: unacknowledgedAlerts } = useQuery({
    queryKey: ['unacknowledged-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_logs')
        .select('*')
        .eq('acknowledged', false)
        .order('sent_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as AlertLog[];
    },
  });

  const createEscalationMutation = useMutation({
    mutationFn: async (escalation: any) => {
      const { error } = await supabase
        .from('alert_escalations')
        .insert([escalation]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-escalations'] });
      toast.success('Eskalasyon kuralı oluşturuldu');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Oluşturulamadı: ' + error.message);
    },
  });

  const deleteEscalationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alert_escalations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-escalations'] });
      toast.success('Eskalasyon kuralı silindi');
    },
  });

  const toggleEscalationMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('alert_escalations')
        .update({ enabled })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-escalations'] });
      toast.success('Eskalasyon kuralı güncellendi');
    },
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase.rpc('acknowledge_alert', {
        p_alert_log_id: alertId,
        p_user_id: user.id,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unacknowledged-alerts'] });
      toast.success('Alert onaylandı');
    },
  });

  const resetForm = () => {
    setNewEscalation({
      name: '',
      enabled: true,
      severity_levels: ['critical'],
      alert_types: [],
      escalation_delay_minutes: 30,
      escalation_levels: [{ type: 'email', recipients: [], message: '' }],
    });
  };

  const addEscalationLevel = () => {
    setNewEscalation({
      ...newEscalation,
      escalation_levels: [
        ...newEscalation.escalation_levels,
        { type: 'email', recipients: [], message: '' },
      ],
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Alert Eskalasyonu
          </h3>
          <p className="text-sm text-muted-foreground">
            Yanıt verilmeyen kritik alertler için otomatik eskalasyon kuralları
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Eskalasyon Kuralı
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Eskalasyon Kuralı</DialogTitle>
              <DialogDescription>
                Yanıt verilmeyen alertler için otomatik eskalasyon ayarları
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Kural Adı</Label>
                <Input
                  value={newEscalation.name}
                  onChange={(e) => setNewEscalation({ ...newEscalation, name: e.target.value })}
                  placeholder="Örn: Kritik Hatalar Eskalasyonu"
                />
              </div>

              <div className="space-y-2">
                <Label>Eskalasyon Gecikmesi (Dakika)</Label>
                <Input
                  type="number"
                  value={newEscalation.escalation_delay_minutes}
                  onChange={(e) => setNewEscalation({ ...newEscalation, escalation_delay_minutes: parseInt(e.target.value) || 30 })}
                  min="5"
                />
                <p className="text-xs text-muted-foreground">Her eskalasyon seviyesi arasında beklenecek süre</p>
              </div>

              <div className="space-y-2">
                <Label>Severity Seviyeleri</Label>
                <div className="flex flex-wrap gap-2">
                  {severityLevels.map((level) => (
                    <Badge
                      key={level.value}
                      variant={newEscalation.severity_levels.includes(level.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const levels = newEscalation.severity_levels.includes(level.value)
                          ? newEscalation.severity_levels.filter(l => l !== level.value)
                          : [...newEscalation.severity_levels, level.value];
                        setNewEscalation({ ...newEscalation, severity_levels: levels });
                      }}
                    >
                      {level.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alert Tipleri (Opsiyonel)</Label>
                <div className="flex flex-wrap gap-2">
                  {alertTypes.map((type) => (
                    <Badge
                      key={type.value}
                      variant={newEscalation.alert_types.includes(type.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const types = newEscalation.alert_types.includes(type.value)
                          ? newEscalation.alert_types.filter(t => t !== type.value)
                          : [...newEscalation.alert_types, type.value];
                        setNewEscalation({ ...newEscalation, alert_types: types });
                      }}
                    >
                      {type.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Eskalasyon Seviyeleri</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEscalationLevel}>
                    <Plus className="h-3 w-3 mr-1" />
                    Seviye Ekle
                  </Button>
                </div>
                {newEscalation.escalation_levels.map((level, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-sm">Seviye {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Tip</Label>
                        <Select
                          value={level.type}
                          onValueChange={(value: string) => {
                            const levels = [...newEscalation.escalation_levels];
                            levels[index] = { ...levels[index], type: value };
                            setNewEscalation({ ...newEscalation, escalation_levels: levels });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">E-posta</SelectItem>
                            <SelectItem value="slack">Slack</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Alıcılar (virgülle ayırın)</Label>
                        <Input
                          placeholder="email1@example.com, email2@example.com"
                          value={level.recipients.join(', ')}
                          onChange={(e) => {
                            const levels = [...newEscalation.escalation_levels];
                            levels[index].recipients = e.target.value.split(',').map(r => r.trim()).filter(Boolean);
                            setNewEscalation({ ...newEscalation, escalation_levels: levels });
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newEscalation.enabled}
                  onCheckedChange={(checked) => setNewEscalation({ ...newEscalation, enabled: checked })}
                />
                <Label>Aktif</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                İptal
              </Button>
              <Button
                onClick={() => createEscalationMutation.mutate(newEscalation)}
                disabled={!newEscalation.name || newEscalation.severity_levels.length === 0}
              >
                Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Unacknowledged Alerts */}
      {unacknowledgedAlerts && unacknowledgedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Yanıt Bekleyen Alertler ({unacknowledgedAlerts.length})
            </CardTitle>
            <CardDescription>
              Bu alertler henüz onaylanmadı ve eskalasyon tetikleyebilir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unacknowledgedAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{alert.severity}</Badge>
                      <Badge variant="outline">{alert.type}</Badge>
                      <span className="text-sm">{alert.message}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(alert.sent_at), "PPp", { locale: tr })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Onayla
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Escalation Rules */}
      <div className="grid gap-4 md:grid-cols-2">
        {escalations?.map((escalation) => (
          <Card key={escalation.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{escalation.name}</CardTitle>
                  <CardDescription>
                    {escalation.escalation_delay_minutes} dakika gecikme
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteEscalationMutation.mutate(escalation.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Durum:</span>
                  <Switch
                    checked={escalation.enabled}
                    onCheckedChange={(checked) =>
                      toggleEscalationMutation.mutate({ id: escalation.id, enabled: checked })
                    }
                  />
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Severity:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {escalation.severity_levels.map((level) => (
                      <Badge key={level} variant="outline">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Eskalasyon Seviyeleri:</span>
                  <div className="mt-1 text-sm">
                    {Array.isArray(escalation.escalation_levels) && escalation.escalation_levels.length} seviye yapılandırıldı
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
