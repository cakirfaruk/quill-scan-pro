import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2 } from "lucide-react";

export const DeleteAccountDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (confirmText !== "HESABIMI SİL") {
      toast({
        title: "Onay hatası",
        description: "Lütfen 'HESABIMI SİL' yazın",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Kullanıcı oturumu bulunamadı");
      }

      // Call edge function to delete user and all data
      const { error: functionError } = await supabase.functions.invoke('delete-user', {
        body: { userId: user.id }
      });

      if (functionError) throw functionError;

      // Sign out
      await supabase.auth.signOut();

      toast({
        title: "Hesap silindi",
        description: "Hesabınız ve tüm verileriniz kalıcı olarak silindi.",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast({
        title: "Silme hatası",
        description: error.message || "Hesap silinirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Trash2 className="mr-2 h-4 w-4" />
          Hesabı Sil
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hesabınızı silmek istediğinizden emin misiniz?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Profil bilgileriniz</li>
              <li>Tüm analizleriniz (tarot, numeroloji, el falı, vb.)</li>
              <li>Postlarınız, yorumlarınız ve beğenileriniz</li>
              <li>Mesajlarınız ve arkadaş listeniz</li>
              <li>Kredileriniz ve rozetleriniz</li>
            </ul>
            <div className="space-y-2 pt-4">
              <Label htmlFor="confirm">
                Onaylamak için <strong>HESABIMI SİL</strong> yazın:
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="HESABIMI SİL"
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== "HESABIMI SİL"}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Siliniyor...
              </>
            ) : (
              "Hesabı Sil"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
