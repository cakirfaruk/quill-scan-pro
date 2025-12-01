import { CompactHeader } from "@/components/CompactHeader";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <CompactHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Kullanım Şartları
          </h1>
        </div>

        <Card className="p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Hizmet Tanımı</h2>
            <p className="text-muted-foreground leading-relaxed">
              Stellara, kullanıcılarına astroloji, numeroloji, tarot ve benzeri mistik analizler sunmanın 
              yanı sıra sosyal etkileşim, eşleşme ve içerik paylaşımı özellikleri sağlayan bir dijital platformdur. 
              Bu hizmetleri kullanarak aşağıdaki şartları kabul etmiş sayılırsınız.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Hesap Oluşturma ve Sorumluluklar</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="font-medium">Hesap oluştururken:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>En az 18 yaşında olmalısınız</li>
                <li>Doğru ve güncel bilgiler sağlamalısınız</li>
                <li>Hesap güvenliğinizden siz sorumlusunuz</li>
                <li>Şifrenizi kimseyle paylaşmamalısınız</li>
                <li>Her kullanıcı yalnızca bir hesap oluşturabilir</li>
                <li>Başkasının kimliğine bürünemezsiniz</li>
              </ul>
              <p className="mt-3">
                Hesabınızda gerçekleşen tüm aktivitelerden siz sorumlusunuz.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Kullanıcı İçeriği ve Davranış Kuralları</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="font-medium">Platform kullanırken aşağıdaki içerik ve davranışlar yasaktır:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Nefret söylemi, ayrımcılık veya taciz içeren içerikler</li>
                <li>Pornografik veya açık saçık içerikler</li>
                <li>Şiddet, tehdit veya zarar verici içerikler</li>
                <li>Yanıltıcı veya sahte bilgiler</li>
                <li>Telif hakkı ihlali içeren içerikler</li>
                <li>Spam, dolandırıcılık veya aldatma</li>
                <li>Kişisel bilgilerin izinsiz paylaşımı</li>
                <li>Platformun güvenliğini tehdit eden aktiviteler</li>
                <li>Botlar veya otomatik sistemler kullanmak</li>
              </ul>
              <p className="mt-3 font-medium">
                Bu kurallara uymayan kullanıcıların hesapları uyarı almadan askıya alınabilir veya silinebilir.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Fikri Mülkiyet Hakları</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Stellara platformunun tasarımı, yazılımı, logosu ve tüm içeriği Stellara'ya aittir ve 
                fikri mülkiyet yasalarıyla korunmaktadır.
              </p>
              <p className="font-medium mt-3">Kullanıcı İçeriği Hakları:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Paylaştığınız içerikler üzerindeki haklar size aittir</li>
                <li>İçeriğinizi platformda görüntüleme ve paylaşma lisansı vermiş olursunuz</li>
                <li>İçeriğinizi istediğiniz zaman silebilirsiniz</li>
                <li>Başkalarının içeriklerini izinsiz kopyalayamazsınız</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Ücretli Hizmetler ve Krediler</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Platform içi kredi sistemi ve premium özellikler:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Krediler satın alarak analizler ve premium özellikler kullanabilirsiniz</li>
                <li>Kredi paketleri iade edilemez</li>
                <li>Kullanılmayan krediler hesabınızda kalır</li>
                <li>Fiyatlar önceden haber verilmeksizin değiştirilebilir</li>
                <li>Ödeme işlemleri güvenli ödeme sağlayıcıları üzerinden gerçekleşir</li>
                <li>Dolandırıcılık tespit edildiğinde hesaplar kapatılır</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Analiz ve Yorumlar Hakkında</h2>
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-amber-600 dark:text-amber-400">ÖNEMLİ UYARI:</strong> Stellara 
                tarafından sunulan tüm analiz, yorum ve tahminler (tarot, burç, numeroloji, el falı vb.) 
                <strong> eğlence ve kişisel gelişim amaçlıdır</strong>. Bu bilgiler:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-muted-foreground">
                <li>Tıbbi, hukuki veya finansal tavsiye değildir</li>
                <li>Kesinlik iddiası taşımaz</li>
                <li>Profesyonel danışmanlığın yerine geçmez</li>
                <li>Kişisel kararlarınızda tek dayanak olmamalıdır</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Sorumluluk Sınırlaması</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Stellara aşağıdaki durumlardan sorumlu tutulamaz:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Kullanıcıların birbirleriyle olan etkileşimlerinden</li>
                <li>Kullanıcı içeriklerinin doğruluğundan</li>
                <li>Hizmet kesintileri veya teknik sorunlardan</li>
                <li>Analiz sonuçlarına dayalı alınan kararlardan</li>
                <li>Üçüncü taraf bağlantılarındaki içeriklerden</li>
                <li>Veri kaybından (düzenli yedekleme yapmanız tavsiye edilir)</li>
              </ul>
              <p className="mt-3 font-medium">
                Platformu "olduğu gibi" kullanırsınız ve tüm riskler size aittir.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Hesap Sonlandırma</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Hesap sonlandırma koşulları:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>İstediğiniz zaman hesabınızı silebilirsiniz</li>
                <li>Şartları ihlal eden hesaplar uyarı olmadan kapatılabilir</li>
                <li>Uzun süre aktif olmayan hesaplar silinebilir</li>
                <li>Hesap kapatıldığında krediler iade edilmez</li>
                <li>İçerikleriniz 30 gün içinde sistemden silinir</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Değişiklikler ve Güncellemeler</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bu Kullanım Şartları'nı herhangi bir zamanda güncelleme hakkımız saklıdır. Önemli değişiklikler 
              yapıldığında kullanıcıları bilgilendireceğiz. Değişikliklerden sonra platformu kullanmaya devam 
              etmeniz, yeni şartları kabul ettiğiniz anlamına gelir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Uyuşmazlık Çözümü</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Bu şartlardan kaynaklanan uyuşmazlıklar öncelikle dostane görüşmelerle çözülmeye çalışılacaktır.
              </p>
              <p className="font-medium">Yasal Yetki:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Türkiye Cumhuriyeti yasaları uygulanır</li>
                <li>İstanbul Mahkemeleri ve İcra Daireleri yetkilidir</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. İletişim</h2>
            <div className="text-muted-foreground space-y-2">
              <p>Kullanım şartları hakkında sorularınız için:</p>
              <p>
                <strong>E-posta:</strong>{" "}
                <a href="mailto:legal@stellara.app" className="text-primary hover:underline">
                  legal@stellara.app
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

export default Terms;
