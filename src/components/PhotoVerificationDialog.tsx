import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Check, X, Loader2, ShieldCheck, Upload } from "lucide-react";
import { motion } from "framer-motion";

interface PhotoVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  profilePhoto: string | null;
  onVerificationSubmitted?: () => void;
}

export const PhotoVerificationDialog = ({
  open,
  onOpenChange,
  userId,
  profilePhoto,
  onVerificationSubmitted,
}: PhotoVerificationDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"intro" | "capture" | "review" | "submitting" | "success">("intro");
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
      setStep("capture");
    } catch (error) {
      toast({
        title: "Kamera Hatası",
        description: "Kameraya erişilemedi. Lütfen izin verin.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setSelfieImage(imageData);
        stopCamera();
        setStep("review");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const retakePhoto = () => {
    setSelfieImage(null);
    startCamera();
  };

  const submitVerification = async () => {
    if (!selfieImage || !profilePhoto) return;

    setStep("submitting");

    try {
      // Upload selfie to storage
      const selfieBlob = await fetch(selfieImage).then((r) => r.blob());
      const selfieFile = new File([selfieBlob], `selfie-${userId}-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(`verifications/${userId}/${selfieFile.name}`, selfieFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profiles")
        .getPublicUrl(`verifications/${userId}/${selfieFile.name}`);

      // Submit verification request
      const { error: insertError } = await supabase.from("photo_verifications").upsert({
        user_id: userId,
        selfie_url: urlData.publicUrl,
        reference_photo_url: profilePhoto,
        verification_status: "pending",
      });

      if (insertError) throw insertError;

      setStep("success");
      toast({
        title: "Doğrulama Gönderildi",
        description: "Fotoğraf doğrulama talebiniz incelemeye alındı.",
      });
      onVerificationSubmitted?.();
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Hata",
        description: "Doğrulama gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
      setStep("review");
    }
  };

  const handleClose = () => {
    stopCamera();
    setSelfieImage(null);
    setStep("intro");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Fotoğraf Doğrulama
          </DialogTitle>
          <DialogDescription>
            Profilinizi doğrulayarak güvenilirliğinizi artırın
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "intro" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="p-4 bg-primary/5 border-primary/20">
                <h4 className="font-medium mb-2">Nasıl Çalışır?</h4>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                      1
                    </span>
                    Profil fotoğrafınızla aynı poz için selfie çekin
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                      2
                    </span>
                    Fotoğraflar karşılaştırılır
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                      3
                    </span>
                    Doğrulama rozeti kazanın ✓
                  </li>
                </ol>
              </Card>

              <div className="flex gap-2">
                {profilePhoto ? (
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Profil Fotoğrafınız</p>
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <Card className="flex-1 aspect-square flex items-center justify-center">
                    <p className="text-sm text-muted-foreground text-center p-4">
                      Önce profil fotoğrafı ekleyin
                    </p>
                  </Card>
                )}
              </div>

              <Button
                onClick={startCamera}
                className="w-full gap-2"
                disabled={!profilePhoto}
              >
                <Camera className="w-4 h-4" />
                Selfie Çek
              </Button>
            </motion.div>
          )}

          {step === "capture" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-primary/50 rounded-lg pointer-events-none" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <Button onClick={capturePhoto} className="w-full gap-2">
                <Camera className="w-4 h-4" />
                Fotoğraf Çek
              </Button>
            </motion.div>
          )}

          {step === "review" && selfieImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Profil</p>
                  <img
                    src={profilePhoto || ""}
                    alt="Profile"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Selfie</p>
                  <img
                    src={selfieImage}
                    alt="Selfie"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={retakePhoto} className="flex-1 gap-2">
                  <X className="w-4 h-4" />
                  Tekrar Çek
                </Button>
                <Button onClick={submitVerification} className="flex-1 gap-2">
                  <Check className="w-4 h-4" />
                  Gönder
                </Button>
              </div>
            </motion.div>
          )}

          {step === "submitting" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center"
            >
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Doğrulama gönderiliyor...</p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Başarıyla Gönderildi!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Doğrulama talebiniz incelemeye alındı. Sonuç size bildirilecek.
              </p>
              <Button onClick={handleClose}>Tamam</Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
