import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2 } from "lucide-react";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { z } from "zod";

const authSchema = z.object({
  username: z.string()
    .trim()
    .min(3, "Kullanıcı adı en az 3 karakter olmalı")
    .max(30, "Kullanıcı adı en fazla 30 karakter olabilir")
    .regex(/^[a-zA-Z0-9_]+$/, "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir"),
  email: z.string()
    .trim()
    .email("Geçerli bir e-posta adresi girin")
    .max(255, "E-posta adresi çok uzun"),
  password: z.string()
    .min(6, "Şifre en az 6 karakter olmalı")
    .max(100, "Şifre çok uzun"),
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/feed");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/feed");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate inputs
      const validation = authSchema.safeParse({ 
        username: username.trim(), 
        email: email.trim(), 
        password 
      });
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: username.trim(),
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          throw new Error("Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın veya şifrenizi sıfırlayın.");
        }
        throw error;
      }

      console.log("Signup successful:", data.user?.email);

      // Show onboarding for new users
      setShowOnboarding(true);

      toast({
        title: "Kayıt başarılı!",
        description: "Hesabınız oluşturuldu. Hemen giriş yapabilirsiniz.",
      });
    } catch (error: any) {
      console.error("Signup error:", error.message);
      toast({
        title: "Kayıt hatası",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate inputs
      const validation = z.object({
        email: z.string().trim().email("Geçerli bir e-posta adresi girin"),
        password: z.string().min(1, "Şifre gerekli"),
      }).safeParse({ email: email.trim(), password });
      
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // Provide more specific error messages
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("E-posta veya şifre hatalı. Lütfen tekrar deneyin veya şifrenizi sıfırlayın.");
        } else if (error.message.includes("Email not confirmed")) {
          throw new Error("E-posta adresiniz henüz onaylanmamış. Lütfen e-postanızı kontrol edin.");
        }
        throw error;
      }

      console.log("Login successful:", data.user?.email);

      toast({
        title: "Giriş başarılı!",
        description: "Hoş geldiniz.",
      });
    } catch (error: any) {
      console.error("Login error:", error.message);
      toast({
        title: "Giriş hatası",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validation = z.object({
        email: z.string().trim().email("Geçerli bir e-posta adresi girin"),
      }).safeParse({ email });
      
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Şifre sıfırlama e-postası gönderildi",
        description: "E-posta adresinizi kontrol edin.",
      });
      setShowResetPassword(false);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <div className="flex items-center justify-center mb-8">
          <div className="p-3 bg-gradient-primary rounded-lg">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          El Yazısı Analizi
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Grafolog AI ile profesyonel analiz
        </p>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="signin">Giriş Yap</TabsTrigger>
            <TabsTrigger value="signup">Kayıt Ol</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            {!showResetPassword ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Giriş yapılıyor...
                    </>
                  ) : (
                    "Giriş Yap"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setShowResetPassword(true)}
                >
                  Şifremi unuttum
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">E-posta</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    "Şifre Sıfırlama Linki Gönder"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setShowResetPassword(false)}
                >
                  Giriş sayfasına dön
                </Button>
              </form>
            )}
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username">Kullanıcı Adı</Label>
                <Input
                  id="signup-username"
                  type="text"
                  placeholder="kullaniciadi"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">E-posta</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Şifre</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  maxLength={100}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kayıt olunuyor...
                  </>
                ) : (
                  "Kayıt Ol"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Kayıt olduğunuzda 10 ücretsiz kredi kazanırsınız!
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </Card>

      <OnboardingDialog 
        open={showOnboarding} 
        onComplete={() => {
          setShowOnboarding(false);
          navigate("/feed");
        }}
      />
    </div>
  );
};

export default Auth;