import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BellOff, Plus, Trash2 } from "lucide-react";
import { addHours, addDays, format } from "date-fns";
import { tr } from "date-fns/locale";

interface AlertSnooze {
  id: string;
  alert_config_id: string | null;
  alert_type: string | null;
  snooze_until: string;
  reason: string | null;
  created_at: string;
}

interface AlertConfig {
  id: string;
  name: string;
}

const alertTypes = [
  { value: 'error', label: 'Hatalar' },
  { value: 'performance', label: 'Performans' },
  { value: 'security', label: 'Güvenlik' },
  { value: 'api', label: 'API' },
  { value: 'database', label: 'Veritabanı' },
  { value: 'authentication', label: 'Kimlik Doğrulama' },
];

const snoozeDurations = [
  { value: '1', label: '1 Saat', hours: 1 },
  { value: '4', label: '4 Saat', hours: 4 },
  { value: '8', label: '8 Saat', hours: 8 },
  { value: '24', label: '1 Gün', hours: 24 },
  { value: '72', label: '3 Gün', hours: 72 },
  { value: '168', label: '1 Hafta', hours: 168 },
];

export function AlertSnoozeManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snoozeType, setSnoozeType] = useState<'config' | 'type'>('type');
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [duration, setDuration] = useState<string>('24');
  const [reason, setReason] = useState<string>('');

  const { data: snoozes, isLoading } = useQuery({
    queryKey: ['alert-snoozes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_snoozes')
        .select('*')
        .gt('snooze_until', new Date().toISOString())
        .order('snooze_until', { ascending: true });
      
      if (error) throw error;
      return data as AlertSnooze[];
    },
  });

  const { data: configs } = useQuery({
    queryKey: ['alert-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alert_configurations')
        .select('id, name')
        .eq('enabled', true);
      
      if (error) throw error;
      return data as AlertConfig[];
    },
  });

  const createSnoozeMutation = useMutation({
    mutationFn: async () => {
      const hours = parseInt(duration);
      const snoozeUntil = addHours(new Date(), hours);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('alert_snoozes')
        .insert({
          alert_config_id: snoozeType === 'config' ? selectedConfig : null,
          alert_type: snoozeType === 'type' ? selectedType : null,
          snooze_until: snoozeUntil.toISOString(),
          reason: reason || null,
          created_by: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-snoozes'] });
      toast.success('Alert sessizleştirildi');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Sessizleştirme başarısız: ' + error.message);
    },
  });

  const deleteSnoozeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alert_snoozes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-snoozes'] });
      toast.success('Sessizleştirme kaldırıldı');
    },
  });

  const resetForm = () => {
    setSnoozeType('type');
    setSelectedConfig('');
    setSelectedType('');
    setDuration('24');
    setReason('');
  };

  const getConfigName = (configId: string | null) => {
    if (!configId) return null;
    return configs?.find(c => c.id === configId)?.name;
  };

  const getTypeName = (type: string | null) => {
    if (!type) return null;
    return alertTypes.find(t => t.value === type)?.label;
  };

  if (isLoading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Alert Sessizleştirme
          </h3>
          <p className="text-sm text-muted-foreground">
            Belirli alert tiplerini veya konfigürasyonlarını geçici olarak sessize alın
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Sessizleştirme
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alert Sessizleştir</DialogTitle>
              <DialogDescription>
                Belirli bir süre için alertleri sessize alın
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sessizleştirme Tipi</Label>
                <Select value={snoozeType} onValueChange={(v: any) => setSnoozeType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="type">Alert Tipi</SelectItem>
                    <SelectItem value="config">Alert Konfigürasyonu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {snoozeType === 'type' && (
                <div className="space-y-2">
                  <Label>Alert Tipi</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tip seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {alertTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {snoozeType === 'config' && (
                <div className="space-y-2">
                  <Label>Alert Konfigürasyonu</Label>
                  <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                    <SelectTrigger>
                      <SelectValue placeholder="Konfigürasyon seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {configs?.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Süre</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {snoozeDurations.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sebep (Opsiyonel)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Neden sessizleştiriyorsunuz?"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                İptal
              </Button>
              <Button
                onClick={() => createSnoozeMutation.mutate()}
                disabled={
                  (snoozeType === 'type' && !selectedType) ||
                  (snoozeType === 'config' && !selectedConfig)
                }
              >
                Sessizleştir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {snoozes && snoozes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {snoozes.map((snooze) => (
            <Card key={snooze.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {snooze.alert_type ? (
                        <Badge variant="outline">{getTypeName(snooze.alert_type)}</Badge>
                      ) : (
                        <Badge variant="secondary">{getConfigName(snooze.alert_config_id)}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {format(new Date(snooze.snooze_until), "PPp", { locale: tr })} kadar sessize alındı
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSnoozeMutation.mutate(snooze.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {snooze.reason && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{snooze.reason}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aktif sessizleştirme yok
          </CardContent>
        </Card>
      )}
    </div>
  );
}
