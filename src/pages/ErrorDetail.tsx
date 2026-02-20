import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  AlertCircle, 
  Clock, 
  User, 
  Globe, 
  Monitor,
  CheckCircle2,
  Save,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  severity: 'info' | 'warning' | 'error' | 'fatal';
  timestamp: string;
  user_id?: string;
  url: string;
  context?: any;
  browser_info?: any;
  fingerprint?: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
}

export default function ErrorDetail() {
  const { errorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: error, isLoading } = useQuery({
    queryKey: ['error-detail', errorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .eq('id', errorId)
        .single();

      if (error) throw error;
      return data as ErrorLog;
    },
    enabled: !!errorId,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', error?.user_id],
    queryFn: async () => {
      if (!error?.user_id) return null;
      
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('user_id', error.user_id)
        .single();

      if (profileError) return null;
      return data;
    },
    enabled: !!error?.user_id,
  });

  useEffect(() => {
    if (error?.notes) {
      setNotes(error.notes);
    }
  }, [error?.notes]);

  const resolveErrorMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from('error_logs')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('id', errorId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-detail', errorId] });
      toast({
        title: "Başarılı",
        description: "Hata çözüldü olarak işaretlendi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Hata güncellenemedi",
        variant: "destructive",
      });
    },
  });

  const saveNotesMutation = useMutation({
    mutationFn: async (newNotes: string) => {
      const { error: updateError } = await supabase
        .from('error_logs')
        .update({ notes: newNotes })
        .eq('id', errorId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-detail', errorId] });
      toast({
        title: "Başarılı",
        description: "Notlar kaydedildi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Notlar kaydedilemedi",
        variant: "destructive",
      });
    },
  });

  const handleSaveNotes = async () => {
    setIsSaving(true);
    await saveNotesMutation.mutateAsync(notes);
    setIsSaving(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'fatal': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'fatal': return 'Kritik';
      case 'error': return 'Hata';
      case 'warning': return 'Uyarı';
      case 'info': return 'Bilgi';
      default: return severity;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Hata Bulunamadı</h3>
          <p className="text-muted-foreground mb-4">
            Bu hata kaydı bulunamadı veya erişim yetkiniz yok
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri
        </Button>
        
        <div className="flex items-center gap-2">
          {error.resolved ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Çözüldü
            </Badge>
          ) : (
            <Button
              onClick={() => resolveErrorMutation.mutate()}
              disabled={resolveErrorMutation.isPending}
              variant="outline"
              size="sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Çözüldü Olarak İşaretle
            </Button>
          )}
        </div>
      </div>

      {/* Error Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl">{error.error_type}</CardTitle>
                <Badge variant={getSeverityColor(error.severity)}>
                  {getSeverityLabel(error.severity)}
                </Badge>
              </div>
              <CardDescription className="text-base">
                {error.error_message}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Zaman:</span>
              <span className="font-medium">
                {format(new Date(error.timestamp), "dd MMMM yyyy, HH:mm:ss", { locale: tr })}
              </span>
            </div>

            {error.user_id && userProfile && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Kullanıcı:</span>
                <span className="font-medium">
                  {userProfile.full_name || userProfile.username}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">URL:</span>
              <span className="font-medium truncate">{error.url}</span>
            </div>

            {error.fingerprint && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Fingerprint:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {error.fingerprint.substring(0, 16)}...
                </code>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stack Trace */}
        <Card>
          <CardHeader>
            <CardTitle>Stack Trace</CardTitle>
            <CardDescription>Hatanın detaylı çağrı yığını</CardDescription>
          </CardHeader>
          <CardContent>
            {error.error_stack ? (
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-[500px] overflow-y-auto">
                <code>{error.error_stack}</code>
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">Stack trace bilgisi yok</p>
            )}
          </CardContent>
        </Card>

        {/* Browser Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Tarayıcı Bilgileri
            </CardTitle>
            <CardDescription>Kullanıcının ortam bilgileri</CardDescription>
          </CardHeader>
          <CardContent>
            {error.browser_info ? (
              <div className="space-y-3">
                {Object.entries(error.browser_info).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tarayıcı bilgisi yok</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Context */}
      {error.context && Object.keys(error.context).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Context Bilgileri</CardTitle>
            <CardDescription>Hatanın oluştuğu bağlam</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-[400px] overflow-y-auto">
              <code>{JSON.stringify(error.context, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Resolution Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Çözüm Notları</CardTitle>
          <CardDescription>
            Bu hata için notlar ve çözüm yöntemleri ekleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Çözüm notları, yapılan değişiklikler veya hatanın nedeni hakkında notlar ekleyin..."
            className="min-h-[150px]"
          />
          
          <div className="flex justify-end">
            <Button
              onClick={handleSaveNotes}
              disabled={isSaving || notes === error.notes}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Notları Kaydet
                </>
              )}
            </Button>
          </div>

          {error.resolved && error.resolved_at && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Çözüldü: {format(new Date(error.resolved_at), "dd MMMM yyyy, HH:mm", { locale: tr })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
