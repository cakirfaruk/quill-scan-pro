import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageSquare, Send, Loader2 } from "lucide-react";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string()
    .trim()
    .nonempty({ message: "Ad soyad alanı boş bırakılamaz" })
    .max(100, { message: "Ad soyad en fazla 100 karakter olabilir" }),
  email: z.string()
    .trim()
    .email({ message: "Geçerli bir e-posta adresi girin" })
    .max(255, { message: "E-posta adresi çok uzun" }),
  category: z.string()
    .nonempty({ message: "Kategori seçiniz" }),
  message: z.string()
    .trim()
    .nonempty({ message: "Mesaj alanı boş bırakılamaz" })
    .max(2000, { message: "Mesaj en fazla 2000 karakter olabilir" }),
});

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      const validation = contactSchema.safeParse(formData);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      // In production, this would call an edge function to send email
      // For now, we'll just show success message
      console.log("Contact form submission:", formData);

      toast({
        title: "Mesajınız gönderildi",
        description: "En kısa sürede size geri dönüş yapacağız.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        category: "",
        message: "",
      });
    } catch (error: any) {
      toast({
        title: "Gönderim hatası",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              İletişim
            </h1>
            <p className="text-muted-foreground">
              Sorularınız, önerileriniz veya sorunlarınız için bize ulaşın
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Destek Formu
              </CardTitle>
              <CardDescription>
                Lütfen aşağıdaki formu doldurun, size en kısa sürede geri dönüş yapalım
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Adınız ve soyadınız"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ornek@email.com"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Teknik Destek</SelectItem>
                      <SelectItem value="billing">Ödeme ve Fatura</SelectItem>
                      <SelectItem value="feature">Özellik Önerisi</SelectItem>
                      <SelectItem value="bug">Hata Bildirimi</SelectItem>
                      <SelectItem value="account">Hesap Sorunları</SelectItem>
                      <SelectItem value="other">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mesajınız</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Lütfen sorununuzu veya önerinizi detaylı olarak açıklayın..."
                    className="min-h-[150px]"
                    maxLength={2000}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.message.length}/2000 karakter
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Mesaj Gönder
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Alternatif İletişim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Bize doğrudan e-posta ile de ulaşabilirsiniz:
              </p>
              <a
                href="mailto:destek@stellara.app"
                className="text-primary hover:underline font-medium"
              >
                destek@stellara.app
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;
