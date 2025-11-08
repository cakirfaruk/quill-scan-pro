import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";

export const ManualAlertTest = () => {
  const [testConfig, setTestConfig] = useState({
    type: 'error' as string,
    severity: 'critical' as 'low' | 'medium' | 'high' | 'critical',
    message: '',
  });
  const [isSending, setIsSending] = useState(false);

  const alertTypes = [
    { value: 'error', label: 'Hatalar' },
    { value: 'performance', label: 'Performans' },
    { value: 'security', label: 'Güvenlik' },
    { value: 'api', label: 'API' },
    { value: 'database', label: 'Veritabanı' },
    { value: 'authentication', label: 'Kimlik Doğrulama' },
  ];

  const sendTestAlert = async () => {
    if (!testConfig.message.trim()) {
      toast.error('Lütfen bir mesaj girin');
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-alert', {
        body: {
          type: testConfig.type,
          severity: testConfig.severity,
          message: testConfig.message,
          details: { 
            timestamp: new Date().toISOString(),
            isTest: true,
          },
        },
      });

      if (error) throw error;
      
      toast.success('Test alert gönderildi!');
      setTestConfig({ ...testConfig, message: '' });
    } catch (error: any) {
      toast.error('Test alert gönderilemedi: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manuel Alert Testi</CardTitle>
        <CardDescription>
          Farklı tip ve severity'lerde test alertleri gönderin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Alert Tipi</Label>
          <Select
            value={testConfig.type}
            onValueChange={(value) => setTestConfig({ ...testConfig, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
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

        <div className="space-y-2">
          <Label>Severity</Label>
          <Select
            value={testConfig.severity}
            onValueChange={(value: any) => setTestConfig({ ...testConfig, severity: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">🟢 Low</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="high">🟠 High</SelectItem>
              <SelectItem value="critical">🔴 Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Mesaj</Label>
          <Textarea
            value={testConfig.message}
            onChange={(e) => setTestConfig({ ...testConfig, message: e.target.value })}
            placeholder="Test alert mesajınızı buraya yazın..."
            rows={3}
          />
        </div>

        <Button 
          onClick={sendTestAlert} 
          disabled={isSending || !testConfig.message.trim()}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSending ? 'Gönderiliyor...' : 'Test Alert Gönder'}
        </Button>
      </CardContent>
    </Card>
  );
};
