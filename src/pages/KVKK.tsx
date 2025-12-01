import { CompactHeader } from "@/components/CompactHeader";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const KVKK = () => {
  return (
    <div className="min-h-screen bg-background">
      <CompactHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            KVKK Aydınlatma Metni
          </h1>
        </div>

        <Card className="p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Veri Sorumlusu</h2>
            <div className="text-muted-foreground space-y-2">
              <p>
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz; 
                veri sorumlusu olarak <strong>Stellara</strong> tarafından aşağıda açıklanan kapsamda 
                işlenebilecektir.
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p><strong>Veri Sorumlusu:</strong> Stellara</p>
                <p><strong>Adres:</strong> [Şirket adresi buraya eklenecek]</p>
                <p>
                  <strong>İletişim:</strong>{" "}
                  <a href="mailto:kvkk@stellara.app" className="text-primary hover:underline">
                    kvkk@stellara.app
                  </a>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. İşlenen Kişisel Veriler</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="font-medium">Platformumuz aracılığıyla aşağıdaki kişisel verileriniz işlenmektedir:</p>
              
              <div className="space-y-4 mt-4">
                <div>
                  <p className="font-semibold text-foreground">Kimlik Bilgileri:</p>
                  <p>Ad, soyad, doğum tarihi, cinsiyet</p>
                </div>

                <div>
                  <p className="font-semibold text-foreground">İletişim Bilgileri:</p>
                  <p>E-posta adresi, telefon numarası (isteğe bağlı)</p>
                </div>

                <div>
                  <p className="font-semibold text-foreground">Profil Bilgileri:</p>
                  <p>Kullanıcı adı, profil fotoğrafı, biyografi, konum bilgisi (isteğe bağlı), burç bilgisi</p>
                </div>

                <div>
                  <p className="font-semibold text-foreground">Analiz Verileri:</p>
                  <p>El yazısı örnekleri, fotoğraflar (el falı, kahve falı), rüya anlatımları, tarot seçimleri, numeroloji hesaplamaları</p>
                </div>

                <div>
                  <p className="font-semibold text-foreground">İçerik Verileri:</p>
                  <p>Gönderiler, yorumlar, mesajlar, hikayeler, beğeniler</p>
                </div>

                <div>
                  <p className="font-semibold text-foreground">İşlem Güvenliği Verileri:</p>
                  <p>IP adresi, çerez bilgileri, cihaz bilgileri, tarayıcı türü, konum bilgisi</p>
                </div>

                <div>
                  <p className="font-semibold text-foreground">Finansal Veriler:</p>
                  <p>Ödeme işlem geçmişi (kredi kartı bilgileri saklanmaz, güvenli ödeme sağlayıcısı kullanılır)</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Kişisel Verilerin İşlenme Amaçları</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Üyelik işlemlerinin yürütülmesi</li>
                <li>Platform hizmetlerinin sunulması ve geliştirilmesi</li>
                <li>Astroloji, numeroloji ve falcılık analizlerinin yapılması</li>
                <li>Kullanıcı eşleştirme algoritmasının çalıştırılması</li>
                <li>Sosyal etkileşim özelliklerinin sağlanması</li>
                <li>İçerik yönetimi ve moderasyonunun yapılması</li>
                <li>Güvenlik ve dolandırıcılık önleme faaliyetlerinin yürütülmesi</li>
                <li>Müşteri destek hizmetlerinin sunulması</li>
                <li>İstatistiksel analizler ve raporlama</li>
                <li>Pazarlama ve iletişim faaliyetleri (onayınız dahilinde)</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Kişisel Verilerin Aktarılması</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Bulut altyapı hizmet sağlayıcılarına (Supabase, AWS vb.)</li>
                <li>Ödeme hizmeti sağlayıcılarına</li>
                <li>Analitik ve performans izleme hizmet sağlayıcılarına</li>
                <li>Hukuki yükümlülükler çerçevesinde kamu kurum ve kuruluşlarına</li>
                <li>Açık rızanız dahilinde üçüncü taraflara</li>
              </ul>
              <p className="mt-3">
                aktarılabilmektedir. Yurt dışına veri aktarımı yapılması durumunda KVKK'nın 9. maddesi uyarınca 
                gerekli önlemler alınmaktadır.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Kişisel Verilerin Toplanma Yöntemi</h2>
            <p className="text-muted-foreground">
              Kişisel verileriniz, web sitesi ve mobil uygulama üzerinden elektronik ortamda, otomatik veya 
              otomatik olmayan yöntemlerle ve bazen de analitik sağlayıcılar gibi üçüncü taraflardan elde 
              edilerek toplanmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Kişisel Verilerin İşlenmesinin Hukuki Sebepleri</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Kişisel verileriniz, KVKK'nın 5. ve 6. maddelerinde belirtilen:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Açık rızanızın bulunması</li>
                <li>Sözleşmenin kurulması veya ifası için gerekli olması</li>
                <li>Yasal yükümlülüğün yerine getirilmesi</li>
                <li>İlgili kişinin kendisi tarafından alenileştirilmiş olması</li>
                <li>Bir hakkın tesisi, kullanılması veya korunması için zorunlu olması</li>
                <li>Meşru menfaatlerimiz için veri işlemenin zorunlu olması</li>
              </ul>
              <p className="mt-3">hukuki sebeplerine dayanılarak işlenmektedir.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Kişisel Veri Sahibinin Hakları</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>KVKK'nın 11. maddesi uyarınca, kişisel veri sahibi olarak aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
                <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
                <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme</li>
                <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
                <li>Düzeltme, silme veya yok edilme taleplerinin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
                <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                <li>Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Haklarınızı Kullanma Yöntemi</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Yukarıda belirtilen haklarınızı kullanmak için kimliğinizi tespit edici gerekli bilgiler 
                ile KVK Kanunu'nun 11. maddesinde belirtilen haklardan kullanmayı talep ettiğiniz hakkınıza 
                yönelik açıklamalarınızı içeren talebinizi:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>
                  <strong>E-posta ile:</strong>{" "}
                  <a href="mailto:kvkk@stellara.app" className="text-primary hover:underline">
                    kvkk@stellara.app
                  </a>{" "}
                  adresine
                </li>
                <li>
                  <strong>Başvuru formu ile:</strong> Platform üzerindeki{" "}
                  <a href="/contact" className="text-primary hover:underline">
                    iletişim sayfası
                  </a>ndan
                </li>
                <li>
                  <strong>Islak imzalı dilekçe ile:</strong> [Şirket adresi] adresine posta veya elden teslim
                </li>
              </ul>
              <p className="mt-3">
                iletebilirsiniz. Talebiniz, niteliğine göre en kısa sürede ve en geç 30 (otuz) gün içinde 
                ücretsiz olarak sonuçlandırılacaktır. İşlemin ayrıca bir maliyet gerektirmesi halinde, 
                Kişisel Verileri Koruma Kurulu tarafından belirlenen tarifedeki ücret alınabilir.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Veri Güvenliği</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kişisel verilerinizin hukuka aykırı olarak işlenmesini ve erişilmesini önlemek, verilerinizin 
              muhafazasını sağlamak amacıyla uygun güvenlik düzeyini temin etmeye yönelik gerekli teknik ve 
              idari tedbirler alınmaktadır. Bu kapsamda SSL/TLS şifreleme, erişim kontrolü, güvenli veri 
              merkezleri ve düzenli güvenlik denetimleri uygulanmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Saklama Süresi</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kişisel verileriniz, işleme amaçlarının gerektirdiği süre boyunca ve her halükarda ilgili mevzuatta 
              öngörülen süre zarfında saklanacaktır. Bu sürenin sonunda, kişisel verileriniz silinecek, 
              yok edilecek veya anonim hale getirilecektir. Hesabınızı silmeniz durumunda, verileriniz 
              30 gün içinde sistemden tamamen silinir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. İletişim</h2>
            <div className="text-muted-foreground space-y-2">
              <p>KVKK kapsamındaki sorularınız ve talepleriniz için:</p>
              <div className="mt-3 p-4 bg-muted/50 rounded-lg">
                <p>
                  <strong>E-posta:</strong>{" "}
                  <a href="mailto:kvkk@stellara.app" className="text-primary hover:underline">
                    kvkk@stellara.app
                  </a>
                </p>
                <p className="mt-2">
                  <strong>İletişim Formu:</strong>{" "}
                  <a href="/contact" className="text-primary hover:underline">
                    stellara.app/contact
                  </a>
                </p>
                <p className="mt-2"><strong>Posta Adresi:</strong> [Şirket adresi buraya eklenecek]</p>
              </div>
            </div>
          </section>

          <div className="pt-6 mt-6 border-t text-sm text-muted-foreground">
            <p>Son Güncelleme: 1 Aralık 2024</p>
            <p className="mt-2">
              Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca hazırlanmıştır.
            </p>
            <p className="mt-2">© 2024 Stellara. Tüm hakları saklıdır.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default KVKK;
