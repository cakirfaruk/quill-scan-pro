import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Share2, Loader2, CheckSquare, Square, MessageCircle, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// PDF Generator Version - Increment this when making changes to PDF generation
const PDF_VERSION = '2.0.0';

interface ShareResultButtonProps {
  content: string;
  title: string;
  analysisId?: string;
  analysisType?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  contentRef?: React.RefObject<HTMLDivElement>;
}

export const ShareResultButton = ({ 
  content, 
  title, 
  analysisId,
  analysisType,
  variant = "outline", 
  size = "sm",
  className = "",
  contentRef
}: ShareResultButtonProps) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfGeneratedAt, setPdfGeneratedAt] = useState<Date | null>(null);
  const { toast } = useToast();

  const loadFriends = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all users this person has messaged or received messages from
      const { data: sentMessages } = await supabase
        .from("messages")
        .select("receiver_id")
        .eq("sender_id", user.id);

      const { data: receivedMessages } = await supabase
        .from("messages")
        .select("sender_id")
        .eq("receiver_id", user.id);

      const uniqueUserIds = new Set([
        ...(sentMessages?.map(m => m.receiver_id) || []),
        ...(receivedMessages?.map(m => m.sender_id) || [])
      ]);

      if (uniqueUserIds.size === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Get profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, profile_photo")
        .in("user_id", Array.from(uniqueUserIds));

      if (profiles) {
        setFriends(profiles);
      }
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(friendId)) {
        newSet.delete(friendId);
      } else {
        newSet.add(friendId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFriends.size === friends.length) {
      setSelectedFriends(new Set());
    } else {
      setSelectedFriends(new Set(friends.map(f => f.user_id)));
    }
  };

  const handleShare = async () => {
    if (selectedFriends.size === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen en az bir arkadaş seçin",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Prepare message content with metadata
      const messageContent = analysisId && analysisType
        ? `📊 **${title}**\n\n${content}\n\n[Analiz ID: ${analysisId}]\n[Analiz Türü: ${analysisType}]`
        : `📊 **${title}**\n\n${content}`;

      // Send messages to all selected friends
      const messages = Array.from(selectedFriends).map(friendId => ({
        sender_id: user.id,
        receiver_id: friendId,
        content: messageContent,
        message_category: "other",
        analysis_id: analysisId || null,
        analysis_type: analysisType || null,
      }));

      const { error } = await supabase.from("messages").insert(messages);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: `Sonuç ${selectedFriends.size} arkadaşınıza gönderildi`,
      });

      setShowShareDialog(false);
      setSelectedFriends(new Set());
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Hata",
        description: "Paylaşım sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleOpenDialog = () => {
    setShowShareDialog(true);
    setSelectedFriends(new Set());
    loadFriends();
  };

  const handleWhatsAppShare = () => {
    const message = `📊 *${title}*\n\n${content}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const generatePDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const timestamp = Date.now();
      console.log(`📄 PDF Generator Version: ${PDF_VERSION} - Timestamp: ${timestamp}`);
      
      toast({
        title: "PDF Oluşturuluyor",
        description: `Lütfen bekleyin... (v${PDF_VERSION})`,
      });
      
      // If contentRef is provided, use the actual UI element with clone method
      if (contentRef?.current) {

        const originalElement = contentRef.current;
        
        // Clone the element deeply
        const clonedElement = originalElement.cloneNode(true) as HTMLElement;
        
        // Create temporary off-screen container with proper styling
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '800px';
        tempContainer.style.maxHeight = 'none';
        tempContainer.style.overflow = 'visible';
        tempContainer.style.padding = '32px';
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        
        // Apply styles to the cloned element to ensure everything is visible
        clonedElement.style.maxHeight = 'none';
        clonedElement.style.overflow = 'visible';
        clonedElement.style.height = 'auto';
        clonedElement.style.display = 'block';
        
        // Expand and fix all content in the clone
        const expandAllContent = (element: HTMLElement) => {
          // Find and expand all collapsed elements (Radix UI components)
          const collapsedElements = element.querySelectorAll('[data-state="closed"]');
          collapsedElements.forEach((el) => {
            (el as HTMLElement).setAttribute('data-state', 'open');
            (el as HTMLElement).style.display = 'block';
            (el as HTMLElement).style.visibility = 'visible';
            (el as HTMLElement).style.opacity = '1';
          });
          
          // Find all elements with max-height and remove the restriction
          const allElements = element.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const computedStyle = window.getComputedStyle(htmlEl);
            
            // Remove height restrictions
            if (computedStyle.maxHeight && computedStyle.maxHeight !== 'none') {
              htmlEl.style.maxHeight = 'none';
            }
            if (computedStyle.overflow === 'hidden' || computedStyle.overflow === 'auto' || computedStyle.overflow === 'scroll') {
              htmlEl.style.overflow = 'visible';
            }
            
            // Remove any transforms that might hide content
            if (computedStyle.transform !== 'none') {
              htmlEl.style.transform = 'none';
            }
            
            // Ensure visibility
            if (computedStyle.display === 'none') {
              htmlEl.style.display = 'block';
            }
            if (computedStyle.visibility === 'hidden') {
              htmlEl.style.visibility = 'visible';
            }
            if (computedStyle.opacity === '0') {
              htmlEl.style.opacity = '1';
            }
          });
          
          // Find all hidden elements by class and make them visible
          const hiddenByClass = element.querySelectorAll('.hidden, [aria-hidden="true"]');
          hiddenByClass.forEach((el) => {
            (el as HTMLElement).style.display = 'block';
            (el as HTMLElement).classList.remove('hidden');
            (el as HTMLElement).removeAttribute('aria-hidden');
          });
          
          // Expand all details/summary elements
          const detailsElements = element.querySelectorAll('details');
          detailsElements.forEach((el) => {
            el.setAttribute('open', 'true');
          });

          // Remove all share buttons from the PDF
          const shareButtons = element.querySelectorAll('button');
          shareButtons.forEach((button) => {
            if (button.textContent?.includes('Paylaş') || button.querySelector('svg')) {
              button.remove();
            }
          });
        };
        
        // Apply expansions to cloned element
        expandAllContent(clonedElement);
        
        // Append cloned element to temp container
        tempContainer.appendChild(clonedElement);
        document.body.appendChild(tempContainer);
        
        // Wait for all images and fonts to load
        const images = tempContainer.querySelectorAll('img');
        const imagePromises = Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        });
        
        await Promise.all(imagePromises);
        await document.fonts.ready;
        
        // Wait for rendering to complete
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Get the actual dimensions of the content
        const contentHeight = tempContainer.scrollHeight;
        const contentWidth = tempContainer.scrollWidth;
        
        // Capture the full content with high quality
        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: contentWidth,
          height: contentHeight,
          windowWidth: contentWidth,
          windowHeight: contentHeight,
          onclone: (clonedDoc) => {
            // Final cleanup in the cloned document
            const clonedContainer = clonedDoc.querySelector('[style*="-9999px"]');
            if (clonedContainer) {
              (clonedContainer as HTMLElement).style.left = '0';
            }
          }
        });
        
        // Clean up temporary container
        document.body.removeChild(tempContainer);
        
        // Generate multi-page PDF with proper dimensions
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Add metadata with version and timestamp
        const timestamp = Date.now();
        pdf.setProperties({
          title: title,
          subject: `Analysis - v${PDF_VERSION}`,
          creator: 'Astro Social',
          author: 'User',
          keywords: `analysis, version ${PDF_VERSION}, generated-${timestamp}`
        });
        let heightLeft = imgHeight;
        let position = 0;
        
        // First page
        pdf.addImage(
          canvas.toDataURL('image/png', 1.0), 
          'PNG', 
          0, 
          position, 
          imgWidth, 
          imgHeight
        );
        heightLeft -= pageHeight;
        
        // Additional pages if content is longer
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(
            canvas.toDataURL('image/png', 1.0), 
            'PNG', 
            0, 
            position, 
            imgWidth, 
            imgHeight
          );
          heightLeft -= pageHeight;
        }
        
        // Convert PDF to Blob and store it
        const pdfBlob = pdf.output('blob');
        setPdfBlob(pdfBlob);
        setPdfGeneratedAt(new Date());
        
        toast({
          title: "PDF Hazır!",
          description: `PDF artık indirilmeye hazır (v${PDF_VERSION})`,
        });
      } else {
        // Fallback to text-only method
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '800px';
        tempDiv.style.padding = '40px';
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.color = 'black';
        tempDiv.innerHTML = `
          <div style="font-family: Arial, sans-serif;">
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #1a1a1a;">${title}</h1>
            <div style="font-size: 14px; line-height: 1.8; white-space: pre-wrap; color: #333;">${content}</div>
          </div>
        `;
        
        document.body.appendChild(tempDiv);
        
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
        });
        
        document.body.removeChild(tempDiv);
        
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // Convert PDF to Blob and store it
        const pdfBlob = pdf.output('blob');
        setPdfBlob(pdfBlob);
        setPdfGeneratedAt(new Date());
        
        toast({
          title: "PDF Hazır!",
          description: `PDF artık indirilmeye hazır (v${PDF_VERSION})`,
        });
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Hata",
        description: "PDF oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfBlob) {
      toast({
        title: "Hata",
        description: "PDF bulunamadı. Lütfen önce PDF oluşturun.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create unique filename with timestamp and random ID
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${timestamp}_${randomId}.pdf`;
      
      // Create a download link
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
      
      toast({
        title: "Başarılı",
        description: "PDF başarıyla indirildi",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Hata",
        description: "PDF indirilirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size}
        onClick={handleOpenDialog}
        className={className}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Paylaş
      </Button>

      <Dialog open={showShareDialog} onOpenChange={(open) => {
        setShowShareDialog(open);
        if (!open) {
          // Clear PDF state when dialog closes
          setPdfBlob(null);
          setPdfGeneratedAt(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Sonucu Paylaş</span>
              {selectedFriends.size > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedFriends.size} seçili
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Analiz sonucunu birden fazla arkadaşınızla paylaşın
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Share Options */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleWhatsAppShare}
                    className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                    size="lg"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    WhatsApp
                  </Button>
                  
                  {!pdfBlob ? (
                    <Button
                      onClick={generatePDF}
                      disabled={isGeneratingPdf}
                      variant="outline"
                      size="lg"
                    >
                      {isGeneratingPdf ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Oluşturuluyor...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5 mr-2" />
                          PDF Oluştur
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={downloadPDF}
                      variant="outline"
                      size="lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      PDF İndir
                    </Button>
                  )}
                </div>

                {friends.length > 0 && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        veya arkadaşlarınızla
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {friends.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  Mesaj geçmişinizde arkadaş bulunamadı
                </p>
              ) : (
                <>
                  {/* Select All / Deselect All */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedFriends.size === friends.length && friends.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    {selectedFriends.size === friends.length ? "Tümünü Kaldır" : "Tümünü Seç"}
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">
                  {friends.length} arkadaş
                </span>
              </div>

              {/* Friends List */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {friends.map((friend) => {
                  const isSelected = selectedFriends.has(friend.user_id);
                  return (
                    <div
                      key={friend.user_id}
                      onClick={() => toggleFriendSelection(friend.user_id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-secondary/50"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleFriendSelection(friend.user_id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={friend.profile_photo} />
                        <AvatarFallback>{friend.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {friend.full_name || friend.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{friend.username}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

                  {/* Share Button */}
                  <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowShareDialog(false)}
                  className="flex-1"
                  disabled={sending}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleShare}
                  disabled={sending || selectedFriends.size === 0}
                  className="flex-1"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      {selectedFriends.size > 0 
                        ? `${selectedFriends.size} Kişiye Gönder` 
                        : "Gönder"}
                    </>
                  )}
                </Button>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
