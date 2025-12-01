import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Link } from "react-router-dom";
import { Sparkles, Mail, Shield, FileText } from "lucide-react";

export const FooterSection = () => {
  const { elementRef, isVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <footer
      ref={elementRef}
      className="py-16 bg-gradient-to-b from-background/50 to-background border-t border-border/50"
    >
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="grid md:grid-cols-4 gap-12 mb-12"
        >
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Stellara</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              Evrenin enerjisi ile yürüyen, ruhunu anlayan insanlarla bağlantı kurmak için tasarlanmış platform.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <span className="sr-only">Instagram</span>
                📷
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <span className="sr-only">Twitter</span>
                🐦
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <span className="sr-only">YouTube</span>
                📺
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Keşfet</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Sıkça Sorulanlar
                </Link>
              </li>
              <li>
                <Link
                  to="/credits"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Kredi Paketleri
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  İletişim
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Yasal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Kullanım Şartları
                </Link>
              </li>
              <li>
                <Link
                  to="/kvkk"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  KVKK
                </Link>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground"
        >
          <p>© 2024 Stellara. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>256-bit SSL Şifreleme</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
