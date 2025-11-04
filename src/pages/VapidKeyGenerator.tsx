import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Key, ShieldAlert } from "lucide-react";
import { generateVapidKeys } from "@/utils/generateVapidKeys";
import { useToast } from "@/hooks/use-toast";

export default function VapidKeyGenerator() {
  const [keys, setKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [copied, setCopied] = useState<{ public: boolean; private: boolean }>({
    public: false,
    private: false,
  });
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      const generatedKeys = await generateVapidKeys();
      setKeys(generatedKeys);
      toast({
        title: "VAPID Keys Oluşturuldu",
        description: "Keys başarıyla oluşturuldu. Şimdi bunları kopyalayıp kaydedin.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Keys oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string, type: 'public' | 'private') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [type]: true });
      toast({
        title: "Kopyalandı",
        description: `${type === 'public' ? 'Public' : 'Private'} key panoya kopyalandı`,
      });
      setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kopyalama başarısız",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Key className="w-8 h-8" />
          VAPID Key Generator
        </h1>
        <p className="text-muted-foreground">
          Push notification için VAPID keys oluşturun
        </p>
      </div>

      <Alert className="mb-6">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          <strong>Önemli:</strong> Private key'i asla paylaşmayın ve Git'e commit etmeyin. 
          Bu key'ler push notification göndermek için kullanılır.
        </AlertDescription>
      </Alert>

      {!keys ? (
        <Card>
          <CardHeader>
            <CardTitle>Yeni VAPID Keys Oluştur</CardTitle>
            <CardDescription>
              Web Push Notifications için VAPID key çifti oluşturun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerate} size="lg" className="w-full">
              <Key className="w-4 h-4 mr-2" />
              Keys Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Public Key */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Public Key (VITE_VAPID_PUBLIC_KEY)</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(keys.publicKey, 'public')}
                >
                  {copied.public ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Bu key'i .env dosyanıza ekleyin (browser'da kullanılacak)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm break-all">
                {keys.publicKey}
              </div>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm font-semibold mb-2">📝 .env dosyanıza ekleyin:</p>
                <code className="text-sm bg-white dark:bg-gray-900 p-2 rounded block">
                  VITE_VAPID_PUBLIC_KEY="{keys.publicKey}"
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Private Key */}
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-red-600 dark:text-red-400">
                <span>Private Key (VAPID_PRIVATE_KEY)</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(keys.privateKey, 'private')}
                >
                  {copied.private ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                ⚠️ Bu key'i GİZLİ tutun! Sadece Supabase Secrets'a ekleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg font-mono text-sm break-all">
                {keys.privateKey}
              </div>
              <Alert className="mt-4" variant="destructive">
                <AlertDescription>
                  <strong>ASLA:</strong>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Bu key'i Git'e commit etmeyin</li>
                    <li>Public olarak paylaşmayın</li>
                    <li>Browser kodunda kullanmayın</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Kurulum Adımları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1️⃣ Lovable Secrets'ı Güncelleyin</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Settings → Secrets sayfasından:
                </p>
                <ul className="list-disc ml-6 text-sm space-y-1">
                  <li><code>VAPID_PUBLIC_KEY</code> - Yukarıdaki public key'i yapıştırın</li>
                  <li><code>VAPID_PRIVATE_KEY</code> - Yukarıdaki private key'i yapıştırın</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2️⃣ .env Dosyasını Güncelleyin</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Projenizi export edip local'de .env dosyasına ekleyin:
                </p>
                <code className="text-sm bg-muted p-2 rounded block">
                  VITE_VAPID_PUBLIC_KEY="{keys.publicKey}"
                </code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3️⃣ Tamamlandı! 🎉</h3>
                <p className="text-sm text-muted-foreground">
                  Push notification sistemi artık çalışmaya hazır. Browser kapalıyken bile 
                  arama bildirimleri gelecek.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={() => setKeys(null)} 
            variant="outline" 
            className="w-full"
          >
            Yeni Keys Oluştur
          </Button>
        </div>
      )}
    </div>
  );
}
