import { useState, useRef, useEffect } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Share2, MessageCircle, Copy, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShareAnalysisToFeedButton } from "./ShareAnalysisToFeedButton";
import { ShareAnalysisToMessagesButton } from "./ShareAnalysisToMessagesButton";

interface LongPressShareMenuProps {
  children: React.ReactNode;
  content: string;
  sectionTitle: string;
  analysisType: string;
  analysisResult?: any;
  analysisId?: string;
}

export const LongPressShareMenu = ({
  children,
  content,
  sectionTitle,
  analysisType,
  analysisResult,
  analysisId,
}: LongPressShareMenuProps) => {
  const { toast } = useToast();
  const [showFeedDialog, setShowFeedDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(`${sectionTitle}\n\n${content}`);
    toast({
      title: "Kopyalandı",
      description: "Bu bölüm panoya kopyalandı",
    });
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="select-text cursor-context-menu">
            {children}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={handleCopyToClipboard}>
            <Copy className="w-4 h-4 mr-2" />
            Bu Bölümü Kopyala
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setShowFeedDialog(true)}>
            <Share2 className="w-4 h-4 mr-2" />
            Feed'de Paylaş
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setShowMessageDialog(true)}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Mesajla Paylaş
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Hidden share buttons that will be triggered programmatically */}
      {showFeedDialog && (
        <div className="hidden">
          <ShareAnalysisToFeedButton
            analysisType={analysisType}
            analysisResult={{ ...analysisResult, selectedSection: { title: sectionTitle, content } }}
            title={`${sectionTitle}`}
            variant="outline"
            size="sm"
          />
        </div>
      )}
    </>
  );
};
