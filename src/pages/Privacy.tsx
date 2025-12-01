import { CompactHeader } from "@/components/CompactHeader";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <CompactHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Gizlilik Politikası
          </h1>
        </div>

        <Card className="p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Giriş</h2>
            <p className="text-muted-foreground leading-relaxed">
              Stellara olarak, kullanıcılarımızın gizliliğine büyük önem veriyoruz. Bu Gizlilik Politikası, 
              kişisel verilerinizi nasıl topladığımız, kullandığımız, sakladığımız ve koruduğumuz hakkında 
              bilgi vermektedir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Toplanan Bilgiler</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="font-medium">Aşağıdaki kişisel bilgileri topluyoruz:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Hesap bilgileri (ad, kullanıcı adı, e-posta adresi, doğum tarihi)</li>
                <li>Profil bilgileri (profil fotoğrafı, biyografi, konum)</li>
                <li>İçerik verileri (gönderiler, yorumlar, mesajlar, hikayeler)</li>
                <li>Analiz sonuçları (tarot, numeroloji, burç yorumları)</li>
                <li>Etkileşim verileri (beğeniler, yorumlar, eşleşmeler)</li>
                <li>Teknik bilgiler (IP adresi, tarayıcı türü, cihaz bilgileri)</li>
                <li>Kullanım verileri (sayfa ziyaretleri, tıklama davranışları)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Bilgilerin Kullanım Amaçları</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Topladığımız bilgileri şu amaçlarla kullanırız:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Hizmetlerimizi sağlamak ve geliştirmek</li>
                <li>Kişiselleştirilmiş deneyim sunmak</li>
                <li>Analiz ve falcılık hizmetleri sunmak</li>
                <li>Kullanıcı eşleştirme ve sosyal özellikler sağlamak</li>
                <li>Güvenlik ve dolandırıcılık önleme</li>
                <li>İstatistiksel analizler yapmak</li>
                <li>Müşteri desteği sağlamak</li>
                <li>Yasal yükümlülükleri yerine getirmek</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Bilgi Paylaşımı</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Kişisel bilgileriniz aşağıdaki durumlarda paylaşılabilir:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Sizin açık onayınızla</li>
                <li>Hizmet sağlayıcılarımızla (hosting, analitik, ödeme işlemleri)</li>
                <li>Yasal zorunluluklar gereği</li>
                <li>Güvenlik tehditlerine karşı koruma için</li>
              </ul>
              <p className="mt-3 font-medium">
                Bilgilerinizi asla üçüncü taraflara reklam amaçlı satmayız.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Veri Güvenliği</h2>
            <p className="text-muted-foreground leading-relaxed">
              Verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanıyoruz:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-3 text-muted-foreground">
              <li>SSL/TLS şifreleme</li>
              <li>Güvenli veri merkezleri</li>
              <li>Erişim kontrolleri ve kimlik doğrulama</li>
              <li>Düzenli güvenlik denetimleri</li>
              <li>Veri minimizasyonu ilkesi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Veri Saklama Süresi</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kişisel verilerinizi, hizmetlerimizi sağlamak için gerekli olduğu sürece veya yasal 
              yükümlülüklerimiz gereği saklarız. Hesabınızı sildiğinizde, verileriniz 30 gün içinde 
              sistemlerimizden tamamen silinir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Kullanıcı Hakları</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Kişisel verilerinize erişim hakkı</li>
                <li>Verilerin düzeltilmesini isteme hakkı</li>
                <li>Verilerin silinmesini isteme hakkı ("unutulma hakkı")</li>
                <li>Veri taşınabilirliği hakkı</li>
                <li>İşleme faaliyetlerine itiraz etme hakkı</li>
                <li>Otomatik karar alma süreçlerine itiraz hakkı</li>
              </ul>
              <p className="mt-3">
                Bu haklarınızı kullanmak için{" "}
                <a href="/contact" className="text-primary hover:underline">
                  iletişim sayfamızdan
                </a>{" "}
                bize ulaşabilirsiniz.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Çerezler (Cookies)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Platformumuzda deneyiminizi iyileştirmek için çerezler kullanıyoruz. Çerez tercihlerinizi 
              ayarlardan yönetebilirsiniz. Detaylı bilgi için çerez politikamızı inceleyebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Çocukların Gizliliği</h2>
            <p className="text-muted-foreground leading-relaxed">
              Hizmetlerimiz 18 yaş ve üzeri kullanıcılara yöneliktir. 18 yaşın altındaki kişilerden 
              bilerek kişisel bilgi toplamayız. Eğer bir çocuğun bilgilerini yanlışlıkla topladığımızı 
              fark edersek, bu bilgileri derhal sileriz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Politika Değişiklikleri</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bu Gizlilik Politikası'nı zaman zaman güncelleyebiliriz. Önemli değişiklikler olduğunda 
              sizi bilgilendireceğiz. Politikadaki değişiklikler bu sayfada yayınlandığı anda yürürlüğe girer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. İletişim</h2>
            <div className="text-muted-foreground space-y-2">
              <p>Gizlilik politikamız hakkında sorularınız için:</p>
              <p>
                <strong>E-posta:</strong>{" "}
                <a href="mailto:privacy@stellara.app" className="text-primary hover:underline">
                  privacy@stellara.app
                </a>
              </p>
              <p>
                <strong>İletişim Formu:</strong>{" "}
                <a href="/contact" className="text-primary hover:underline">
                  stellara.app/contact
                </a>
              </p>
            </div>
          </section>

          <div className="pt-6 mt-6 border-t text-sm text-muted-foreground">
            <p>Son Güncelleme: 1 Aralık 2024</p>
            <p className="mt-2">© 2024 Stellara. Tüm hakları saklıdır.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
