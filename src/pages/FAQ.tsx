import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      question: "El yazısı analizi nasıl çalışır?",
      answer:
        "El yazısı analizi, grafologi biliminin temel prensiplerini kullanarak yapılır. Sistemimiz, el yazınızdaki harf şekilleri, eğimler, basınç, kelime aralıkları ve diğer özellikleri analiz eder. AI destekli algoritmalarımız bu verileri işleyerek kişilik özellikleriniz hakkında detaylı raporlar oluşturur.",
    },
    {
      question: "Analizler ne kadar güvenilir?",
      answer:
        "Analizlerimiz, yüzyıllardır geliştirilmiş grafologi biliminin modern AI teknolojisi ile birleşiminden oluşur. Sonuçlar yüksek doğruluk oranına sahiptir ancak tam bir psikolojik değerlendirme yerine geçmez. Kişisel gelişim ve kendini tanıma amaçlı kullanılması önerilir.",
    },
    {
      question: "Hangi formatta el yazısı yükleyebilirim?",
      answer:
        "JPG, PNG veya PDF formatlarında el yazısı örnekleri yükleyebilirsiniz. El yazısının net ve okunaklı olması analiz kalitesini artırır. Düz beyaz bir kağıda mavi veya siyah kalemle yazılmış örnekler en iyi sonuçları verir.",
    },
    {
      question: "Kredi sistemi nasıl çalışır?",
      answer:
        "Her analiz konusu 1 kredi tüketir. Kayıt olduğunuzda 10 ücretsiz kredi kazanırsınız. Daha fazla analiz yapmak için kredi paketleri satın alabilirsiniz. Uyum analizi 50 kredi tüketir.",
    },
    {
      question: "Verilerim güvende mi?",
      answer:
        "Evet, tüm verileriniz şifrelenir ve güvenli sunucularda saklanır. El yazısı örnekleriniz sadece analiz için kullanılır ve üçüncü şahıslarla paylaşılmaz. İstediğiniz zaman hesabınızı ve tüm verilerinizi silebilirsiniz.",
    },
    {
      question: "Uyum analizi nedir?",
      answer:
        "Uyum analizi, iki farklı kişinin el yazısını karşılaştırarak karakteristik uyumlarını değerlendirir. İlişki uyumu, iş ortaklığı potansiyeli veya genel kişilik uyumu hakkında bilgiler sunar. Bu analiz 50 kredi tüketir.",
    },
    {
      question: "Geçmiş analizlerimi görebilir miyim?",
      answer:
      "Evet, 'Geçmiş Analizler' sayfasından tüm önceki analizlerinizi görüntüleyebilir, detaylarını inceleyebilir ve sonuçları tekrar gözden geçirebilirsiniz.",
    },
    {
      question: "Analiz ne kadar sürer?",
      answer:
        "Analiz süreci genellikle 1-3 dakika arasında tamamlanır. Bu süre, seçilen konu sayısına ve sistemin yüküne göre değişebilir. Analiz sırasında ilerleme çubuğundan süreci takip edebilirsiniz.",
    },
    {
      question: "Hangi konularda analiz yapabilirim?",
      answer:
        "13 farklı konuda analiz yapabilirsiniz: Genel Kişilik, Duygusal Zeka, Sosyal Beceriler, Zihinsel Kapasite, İş Hayatı Profili, İletişim Tarzı, Karar Verme, Stres Yönetimi, Yaratıcılık, Liderlik Özellikleri, Detaycılık, Risk Alma Eğilimi ve Empati Düzeyi.",
    },
    {
      question: "Kullanılmayan krediler iptal olur mu?",
      answer:
        "Hayır, satın aldığınız kredilerin son kullanma tarihi yoktur. İstediğiniz zaman kullanabilirsiniz.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
            <HelpCircle className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Sıkça Sorulan Sorular
          </h1>
          <p className="text-xl text-muted-foreground">
            El yazısı analizi hakkında merak ettikleriniz
          </p>
        </div>

        <Card className="p-8 shadow-elegant">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-left font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">Sorunuz cevaplanmadı mı?</h3>
            <p className="text-muted-foreground">
              Başka sorularınız için bizimle iletişime geçebilirsiniz
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default FAQ;
