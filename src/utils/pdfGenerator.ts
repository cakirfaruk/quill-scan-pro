import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

export const PDF_VERSION = '5.1.0'; // Universal PDF generator with QR code and profile photo

export const PDF_CONFIG = {
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

// Helper to encode Turkish characters properly
export const encodeTurkishText = (text: string): string => {
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

// Helper function to add cover page with logo, profile photo and QR code
export const addCoverPage = async (
  pdf: jsPDF, 
  title: string, 
  date: string, 
  userName: string = "Kullanıcı",
  avatarUrl?: string | null,
  shareUrl?: string
) => {
  const pageWidth = 210;
  const pageHeight = 297;
  
  // Background gradient effect
  pdf.setFillColor(245, 243, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Profile photo (top center, above mystical symbol)
  if (avatarUrl) {
    try {
      const avatarImg = new Image();
      avatarImg.crossOrigin = "anonymous";
      avatarImg.src = avatarUrl;
      await new Promise<void>((resolve) => {
        avatarImg.onload = () => resolve();
        avatarImg.onerror = () => resolve();
      });
      
      // Circular mask effect with border
      const avatarSize = 20;
      const avatarX = pageWidth / 2 - avatarSize / 2;
      const avatarY = 35;
      
      // Border circle
      pdf.setFillColor(139, 92, 246);
      pdf.circle(pageWidth / 2, avatarY + avatarSize / 2, avatarSize / 2 + 1, 'F');
      
      // White background for circular mask
      pdf.setFillColor(255, 255, 255);
      pdf.circle(pageWidth / 2, avatarY + avatarSize / 2, avatarSize / 2, 'F');
      
      // Add avatar image
      pdf.addImage(
        avatarImg,
        'JPEG',
        avatarX,
        avatarY,
        avatarSize,
        avatarSize,
        undefined,
        'FAST'
      );
    } catch (error) {
      console.error('Avatar could not be added:', error);
    }
  }
  
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
  
  // QR Code (bottom center, above footer)
  if (shareUrl) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 400,
        margin: 1,
        color: {
          dark: '#8B5CF6',
          light: '#FFFFFF'
        }
      });
      
      const qrSize = 30;
      const qrX = pageWidth / 2 - qrSize / 2;
      const qrY = 220;
      
      // QR code background
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 3, 3, 'F');
      
      // Add QR code
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      
      // QR code label
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(encodeTurkishText('Analizi Paylaş'), pageWidth / 2, qrY + qrSize + 6, { align: 'center' });
    } catch (error) {
      console.error('QR code could not be generated:', error);
    }
  }
  
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
export const addPageNumbers = async (pdf: jsPDF, currentPage: number, totalPages: number) => {
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

// Helper to render a single content box
export const renderSingleBox = async (config: {
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

// Smart page placement for multiple boxes
export const calculatePageLayout = (boxes: Array<{ height: number }>) => {
  let estimatedPages = 2; // Start with cover + first content page
  let tempY = PDF_CONFIG.margins.top;
  
  for (const box of boxes) {
    const remainingSpace = PDF_CONFIG.contentArea.maxHeight - tempY;
    if (box.height > remainingSpace && tempY > PDF_CONFIG.margins.top) {
      estimatedPages++;
      tempY = PDF_CONFIG.margins.top;
    }
    tempY += box.height + 10;
  }
  
  return estimatedPages;
};

// Place boxes on PDF with smart page breaking
export const placeBoxesOnPdf = async (
  pdf: jsPDF,
  boxes: Array<{ canvas: HTMLCanvasElement; height: number }>,
  totalPages: number
) => {
  const imgWidth = 170; // A4 width minus margins
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
};
