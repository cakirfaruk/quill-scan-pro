import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Share2, Loader2, CheckSquare, Square, MessageCircle, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// PDF Generator Version - Increment this when making changes to PDF generation
const PDF_VERSION = '4.0.0'; // Smart box rendering with proper page breaks

const PDF_CONFIG = {
  pageWidth: 210,
  pageHeight: 297,
  margins: {
    top: 35,
    bottom: 30,
    left: 20,
    right: 20
  },
  footer: {
    y: 275
  },
  contentArea: {
    maxHeight: 240
  },
  fonts: {
    summaryTitle: 26,
    summaryText: 17,
    topicTitle: 20,
    topicText: 16
  }
};

interface ShareResultButtonProps {
  content: string;
  title: string;
  analysisId?: string;
  analysisType?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  contentRef?: React.RefObject<HTMLDivElement>;
  result?: any; // Full analysis result object for PDF generation
}

export const ShareResultButton = ({ 
  content, 
  title, 
  analysisId,
  analysisType,
  variant = "outline", 
  size = "sm",
  className = "",
  contentRef,
  result
}: ShareResultButtonProps) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfGeneratedAt, setPdfGeneratedAt] = useState<Date | null>(null);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfProgressStep, setPdfProgressStep] = useState("");
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

  // Helper to encode Turkish characters properly
  const encodeTurkishText = (text: string): string => {
    return text
      .normalize('NFC')
      .replace(/İ/g, '\u0130')
      .replace(/ı/g, '\u0131')
      .replace(/Ş/g, '\u015E')
      .replace(/ş/g, '\u015F')
      .replace(/Ğ/g, '\u011E')
      .replace(/ğ/g, '\u011F')
      .replace(/Ü/g, '\u00DC')
      .replace(/ü/g, '\u00FC')
      .replace(/Ö/g, '\u00D6')
      .replace(/ö/g, '\u00F6')
      .replace(/Ç/g, '\u00C7')
      .replace(/ç/g, '\u00E7');
  };

  // Helper function to add cover page with logo
  const addCoverPage = (pdf: jsPDF, title: string, date: string, userName: string = "Kullanıcı") => {
    const pageWidth = 210;
    const pageHeight = 297;
    
    // Background gradient effect
    pdf.setFillColor(245, 243, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Decorative circles (mystical symbol)
    pdf.setFillColor(139, 92, 246);
    pdf.circle(pageWidth / 2, 80, 25, 'F');
    pdf.setFillColor(167, 139, 250);
    pdf.circle(pageWidth / 2, 80, 18, 'F');
    pdf.setFillColor(196, 181, 253);
    pdf.circle(pageWidth / 2, 80, 10, 'F');
    
    // Star decoration
    pdf.setFillColor(255, 255, 255);
    for (let i = 0; i < 5; i++) {
      const angle = (i * 144 - 90) * Math.PI / 180;
      const x = pageWidth / 2 + 8 * Math.cos(angle);
      const y = 80 + 8 * Math.sin(angle);
      pdf.circle(x, y, 1.5, 'F');
    }
    
    // Title (with proper Turkish character encoding)
    pdf.setFontSize(24);
    pdf.setTextColor(139, 92, 246);
    const titleLines = pdf.splitTextToSize(encodeTurkishText(title), 160);
    let titleY = 130;
    titleLines.forEach((line: string) => {
      pdf.text(line, pageWidth / 2, titleY, { align: 'center' });
      titleY += 8;
    });
    
    // Decorative line
    pdf.setDrawColor(139, 92, 246);
    pdf.setLineWidth(0.5);
    pdf.line(60, titleY + 5, 150, titleY + 5);
    
    // User name
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text(encodeTurkishText(userName), pageWidth / 2, titleY + 15, { align: 'center' });
    
    // Date
    pdf.setFontSize(11);
    pdf.setTextColor(120, 120, 120);
    pdf.text(encodeTurkishText(date), pageWidth / 2, titleY + 25, { align: 'center' });
    
    // Footer with mystical elements
    pdf.setFillColor(139, 92, 246);
    pdf.circle(30, 275, 2, 'F');
    pdf.circle(180, 275, 2, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Astro Social', pageWidth / 2, 273, { align: 'center' });
    pdf.setFontSize(8);
    pdf.text(`v${PDF_VERSION}`, pageWidth / 2, 278, { align: 'center' });
  };

  // Helper function to add page numbers and logo
  const addPageNumbers = async (pdf: jsPDF, currentPage: number, totalPages: number) => {
    // Add logo
    try {
      const logoSize = 8;
      const logoImg = new Image();
      logoImg.src = '/icon-192.png';
      await new Promise<void>((resolve) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => resolve();
      });
      pdf.addImage(
        logoImg,
        'PNG',
        PDF_CONFIG.pageWidth - 15,
        10,
        logoSize,
        logoSize
      );
    } catch (error) {
      console.error('Logo could not be added:', error);
    }
    
    // Page number
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    const pageText = encodeTurkishText(`Sayfa ${currentPage} / ${totalPages}`);
    pdf.text(
      pageText,
      PDF_CONFIG.pageWidth / 2,
      PDF_CONFIG.footer.y,
      { align: 'center' }
    );
    
    // Date
    const dateText = encodeTurkishText(new Date().toLocaleDateString('tr-TR'));
    pdf.text(dateText, 15, PDF_CONFIG.footer.y);
    
    // App name
    pdf.text('Astro Social', PDF_CONFIG.pageWidth - 15, PDF_CONFIG.footer.y, { align: 'right' });
  };

  // Helper to render a single box
  const renderSingleBox = async (config: {
    title: string;
    content: string;
    gradient: 'blue' | 'purple';
  }): Promise<HTMLCanvasElement> => {
    const boxDiv = document.createElement('div');
    boxDiv.style.width = '794px';
    boxDiv.style.padding = '30px';
    boxDiv.style.backgroundColor = '#ffffff';
    boxDiv.style.fontFamily = 'Arial, sans-serif';
    boxDiv.style.position = 'absolute';
    boxDiv.style.left = '-9999px';

    const gradientColors = config.gradient === 'blue' 
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))'
      : 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1))';

    const borderColor = config.gradient === 'blue' ? '#3b82f6' : '#9333ea';

    boxDiv.innerHTML = `
      <div style="
        background: ${gradientColors};
        border-left: 4px solid ${borderColor};
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      ">
        <h2 style="
          color: #1f2937;
          font-size: ${PDF_CONFIG.fonts.topicTitle}px;
          font-weight: bold;
          margin: 0 0 16px 0;
          padding-bottom: 12px;
          border-bottom: 2px solid ${borderColor};
        ">${encodeTurkishText(config.title)}</h2>
        <div style="
          color: #374151;
          font-size: ${PDF_CONFIG.fonts.topicText}px;
          line-height: 1.6;
          white-space: pre-wrap;
        ">${encodeTurkishText(config.content)}</div>
      </div>
    `;

    document.body.appendChild(boxDiv);
    const canvas = await html2canvas(boxDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    document.body.removeChild(boxDiv);

    return canvas;
  };

  const generatePDF = async () => {
    setIsGeneratingPdf(true);
    setPdfProgress(0);
    setPdfProgressStep("İçerik hazırlanıyor...");
    
    const timestamp = Date.now();
    
    try {
      console.log(`📄 PDF Generator v${PDF_VERSION} - Timestamp: ${timestamp}`);
      
      toast({
        title: "PDF Oluşturuluyor",
        description: "Bu işlem birkaç saniye sürebilir...",
      });

      if (result) {
        console.log("📊 Analysis Result Structure:", {
          hasOverallSummary: !!result.overall_summary,
          hasTopics: !!result.topics,
          topicsKeys: result.topics ? Object.keys(result.topics) : [],
          topicsCount: result.topics ? Object.keys(result.topics).length : 0,
        });
      }

      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email?.split('@')[0] || 'Kullanıcı';

      setPdfProgress(10);
      setPdfProgressStep("PDF hazırlanıyor...");

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add cover page
      addCoverPage(
        pdf,
        title,
        new Date().toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        userName
      );

      // If we have the result object, use smart box rendering
      if (result && (result.overall_summary || result.topics)) {
        setPdfProgress(20);
        setPdfProgressStep("İçerik kutuları oluşturuluyor...");

        // Collect all boxes to render
        const boxes: Array<{ canvas: HTMLCanvasElement; height: number }> = [];
        const imgWidth = 170; // A4 width minus margins

        // Overall Summary
        if (result.overall_summary) {
          const summaryCanvas = await renderSingleBox({
            title: 'Genel Değerlendirme',
            content: result.overall_summary,
            gradient: 'purple'
          });
          boxes.push({
            canvas: summaryCanvas,
            height: (summaryCanvas.height * imgWidth) / summaryCanvas.width
          });
        }

        setPdfProgress(40);
        setPdfProgressStep("Konular oluşturuluyor...");

        // Topics
        if (result.topics && typeof result.topics === 'object') {
          let index = 0;
          for (const [topicName, topicData] of Object.entries(result.topics) as [string, any][]) {
            let explanation = '';
            if (topicData.explanation) {
              explanation = topicData.explanation;
            } else {
              const parts = [
                topicData.calculation,
                topicData.meaning,
                topicData.personal_interpretation,
                topicData.references
              ].filter(Boolean);
              explanation = parts.join('\n\n');
            }

            if (!explanation) continue;

            const topicCanvas = await renderSingleBox({
              title: topicName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              content: explanation,
              gradient: index % 2 === 0 ? 'blue' : 'purple'
            });
            boxes.push({
              canvas: topicCanvas,
              height: (topicCanvas.height * imgWidth) / topicCanvas.width
            });
            index++;
          }
        }

        setPdfProgress(60);
        setPdfProgressStep("Sayfalar düzenleniyor...");

        // Calculate total pages
        let estimatedPages = 2; // Start with cover page + first content page
        let tempY = PDF_CONFIG.margins.top;
        for (const box of boxes) {
          const remainingSpace = PDF_CONFIG.contentArea.maxHeight - tempY;
          if (box.height > remainingSpace && tempY > PDF_CONFIG.margins.top) {
            estimatedPages++;
            tempY = PDF_CONFIG.margins.top;
          }
          tempY += box.height + 10;
        }
        const totalPages = estimatedPages;

        setPdfProgress(75);
        setPdfProgressStep("PDF oluşturuluyor...");

        // Place boxes with smart page breaking
        let currentY = PDF_CONFIG.margins.top;
        let currentPage = 2;

        pdf.addPage();
        await addPageNumbers(pdf, currentPage, totalPages);

        for (const box of boxes) {
          const boxHeight = box.height;
          const remainingSpace = PDF_CONFIG.contentArea.maxHeight - currentY;

          // If box doesn't fit, start new page
          if (boxHeight > remainingSpace && currentY > PDF_CONFIG.margins.top) {
            pdf.addPage();
            currentPage++;
            await addPageNumbers(pdf, currentPage, totalPages);
            currentY = PDF_CONFIG.margins.top;
          }

          // Add box to current page
          pdf.addImage(
            box.canvas.toDataURL('image/jpeg', 0.95),
            'JPEG',
            PDF_CONFIG.margins.left,
            currentY,
            imgWidth,
            boxHeight
          );

          currentY += boxHeight + 10; // 10mm gap between boxes
        }

        setPdfProgress(90);
        setPdfProgressStep("Tamamlanıyor...");

        // Save as blob
        const pdfBlob = pdf.output('blob');
        setPdfBlob(pdfBlob);

        setPdfProgress(100);
        setPdfProgressStep("Tamamlandı!");

        toast({
          title: "PDF Hazır",
          description: "PDF başarıyla oluşturuldu. İndirebilirsiniz.",
        });
      } else if (contentRef?.current) {
        // Fallback to contentRef method
        const originalElement = contentRef.current;
        const clonedElement = originalElement.cloneNode(true) as HTMLElement;
        
        // Step 2: Create container
        setPdfProgressStep("Container oluşturuluyor...");
        setPdfProgress(25);
        
        // Create temporary off-screen container with proper styling
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '1200px';
        tempContainer.style.maxHeight = 'none';
        tempContainer.style.overflow = 'visible';
        tempContainer.style.padding = '60px';
        tempContainer.style.backgroundColor = '#ffffff';
        tempContainer.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        
        // Apply styles to the cloned element to ensure everything is visible
        clonedElement.style.maxHeight = 'none';
        clonedElement.style.overflow = 'visible';
        clonedElement.style.height = 'auto';
        clonedElement.style.display = 'block';
        
        // Step 3: Expand content
        setPdfProgressStep("Tüm bölümler açılıyor...");
        setPdfProgress(40);
        
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
          
          // Open all accordion/collapsible items
          const accordionTriggers = element.querySelectorAll('[data-radix-collection-item]');
          accordionTriggers.forEach((trigger) => {
            const button = trigger.querySelector('button');
            if (button) {
              button.setAttribute('data-state', 'open');
              button.setAttribute('aria-expanded', 'true');
            }
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
            
            // Force expand heights
            if (computedStyle.height && computedStyle.height !== 'auto') {
              htmlEl.style.height = 'auto';
            }
          });
          
          // Find all hidden elements by class and make them visible
          const hiddenByClass = element.querySelectorAll('.hidden, [aria-hidden="true"], [hidden]');
          hiddenByClass.forEach((el) => {
            (el as HTMLElement).style.display = 'block';
            (el as HTMLElement).classList.remove('hidden');
            (el as HTMLElement).removeAttribute('aria-hidden');
            (el as HTMLElement).removeAttribute('hidden');
          });
          
          // Expand all details/summary elements
          const detailsElements = element.querySelectorAll('details');
          detailsElements.forEach((el) => {
            el.setAttribute('open', 'true');
            el.open = true;
          });

          // Remove all share buttons from the PDF
          const shareButtons = element.querySelectorAll('button');
          shareButtons.forEach((button) => {
            if (button.textContent?.includes('Paylaş') || 
                button.textContent?.includes('Share') ||
                button.querySelector('[data-lucide="share"]')) {
              button.remove();
            }
          });
        };
        
        // Apply expansions to cloned element
        expandAllContent(clonedElement);
        
        // Append cloned element to temp container
        tempContainer.appendChild(clonedElement);
        document.body.appendChild(tempContainer);
        
        // Step 4: Wait for resources
        setPdfProgressStep("Görseller ve fontlar yükleniyor...");
        setPdfProgress(55);
        
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 5: Render canvas
        setPdfProgressStep("Yüksek kaliteli görsel oluşturuluyor...");
        setPdfProgress(70);
        
        // Get the actual dimensions of the content
        const contentHeight = tempContainer.scrollHeight;
        const contentWidth = tempContainer.scrollWidth;
        
        // Capture the full content with high quality
        const canvas = await html2canvas(tempContainer, {
          scale: 3, // High quality
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: contentWidth,
          height: contentHeight,
          windowWidth: contentWidth,
          windowHeight: contentHeight,
          imageTimeout: 15000,
          onclone: (clonedDoc) => {
            // Final cleanup in the cloned document - preserve colors and gradients
            const clonedContainer = clonedDoc.querySelector('[style*="-9999px"]') as HTMLElement;
            if (clonedContainer) {
              clonedContainer.style.left = '0';
              
              // Preserve all background images and colors
              const allElements = clonedContainer.querySelectorAll('*');
              allElements.forEach(el => {
                const originalEl = el as HTMLElement;
                const computedStyle = window.getComputedStyle(originalEl);
                
                if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
                  originalEl.style.backgroundImage = computedStyle.backgroundImage;
                }
                if (computedStyle.backgroundColor) {
                  originalEl.style.backgroundColor = computedStyle.backgroundColor;
                }
                if (computedStyle.color) {
                  originalEl.style.color = computedStyle.color;
                }
              });
            }
          }
        });
        
        // Clean up temporary container
        document.body.removeChild(tempContainer);
        
        // Step 6: Create PDF
        setPdfProgressStep("PDF dosyası oluşturuluyor...");
        setPdfProgress(85);
        
        // Get user info for cover page
        const { data: { user } } = await supabase.auth.getUser();
        let userName = "Kullanıcı";
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, username")
            .eq("user_id", user.id)
            .single();
          userName = profile?.full_name || profile?.username || "Kullanıcı";
        }
        
        // Generate multi-page PDF with proper dimensions
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const margin = 15;
        
        // Add cover page
        const dateStr = new Date().toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        addCoverPage(pdf, title, dateStr, userName);
        
        // Calculate how many content pages we need
        const imgWidth = pageWidth - (2 * margin);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const numContentPages = Math.ceil(imgHeight / (pageHeight - 2 * margin));
        
        // Add content pages
        for (let i = 0; i < numContentPages; i++) {
          pdf.addPage();
          
          const positionY = -(i * (pageHeight - 2 * margin));
          
          pdf.addImage(
            canvas.toDataURL('image/png', 1.0),
            'PNG',
            margin,
            margin + positionY,
            imgWidth,
            imgHeight
          );
          
          // Add page number (starting from 2, since cover is page 1)
          addPageNumbers(pdf, i + 2, numContentPages + 1);
        }
        
        // Add metadata
        pdf.setProperties({
          title: title,
          subject: `Analysis - v${PDF_VERSION}`,
          creator: 'Astro Social',
          author: userName,
          keywords: `analysis, version ${PDF_VERSION}, generated-${timestamp}`
        });
        
        // Step 7: Finalize
        setPdfProgressStep("Tamamlanıyor...");
        setPdfProgress(100);
        
        // Convert PDF to Blob and store it
        const pdfBlob = pdf.output('blob');
        setPdfBlob(pdfBlob);
        setPdfGeneratedAt(new Date());
        
        toast({
          title: "PDF Hazır!",
          description: `PDF başarıyla oluşturuldu (v${PDF_VERSION})`,
        });
      } else {
        // Fallback to text-only method
        setPdfProgressStep("Metin içeriği hazırlanıyor...");
        setPdfProgress(50);
        
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '1200px';
        tempDiv.style.padding = '60px';
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.color = 'black';
        tempDiv.innerHTML = `
          <div style="font-family: Arial, sans-serif;">
            <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 30px; color: #8b5cf6;">${title}</h1>
            <div style="font-size: 14px; line-height: 1.8; white-space: pre-wrap; color: #333;">${content}</div>
          </div>
        `;
        
        document.body.appendChild(tempDiv);
        
        setPdfProgressStep("PDF oluşturuluyor...");
        setPdfProgress(80);
        
        const canvas = await html2canvas(tempDiv, {
          scale: 3,
          backgroundColor: '#ffffff',
          logging: false,
        });
        
        document.body.removeChild(tempDiv);
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Add cover page
        const { data: { user } } = await supabase.auth.getUser();
        let userName = "Kullanıcı";
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, username")
            .eq("user_id", user.id)
            .single();
          userName = profile?.full_name || profile?.username || "Kullanıcı";
        }
        
        const dateStr = new Date().toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        addCoverPage(pdf, title, dateStr, userName);
        
        // Add content
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;
        const imgWidth = pageWidth - (2 * margin);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const numPages = Math.ceil(imgHeight / (pageHeight - 2 * margin));
        
        for (let i = 0; i < numPages; i++) {
          pdf.addPage();
          const positionY = -(i * (pageHeight - 2 * margin));
          pdf.addImage(
            canvas.toDataURL('image/png', 1.0),
            'PNG',
            margin,
            margin + positionY,
            imgWidth,
            imgHeight
          );
          addPageNumbers(pdf, i + 2, numPages + 1);
        }
        
        setPdfProgress(100);
        
        // Convert PDF to Blob and store it
        const pdfBlob = pdf.output('blob');
        setPdfBlob(pdfBlob);
        setPdfGeneratedAt(new Date());
        
        toast({
          title: "PDF Hazır!",
          description: `PDF başarıyla oluşturuldu (v${PDF_VERSION})`,
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
      setPdfProgress(0);
      setPdfProgressStep("");
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
