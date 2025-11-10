import { Card } from "@/components/ui/card";
import { ShareAnalysisToFeedButton } from "@/components/ShareAnalysisToFeedButton";
import { ShareAnalysisToMessagesButton } from "@/components/ShareAnalysisToMessagesButton";

interface AnalysisShareActionsProps {
  analysisType: string;
  analysisResult: any;
  title: string;
  analysisId?: string;
}

export const AnalysisShareActions = ({
  analysisType,
  analysisResult,
  title,
  analysisId
}: AnalysisShareActionsProps) => {
  return (
    <Card className="p-3 sm:p-4 border border-border">
      <h4 className="text-sm font-semibold text-foreground mb-3">Paylaş</h4>
      <div className="flex flex-col sm:flex-row gap-2">
        <ShareAnalysisToFeedButton
          analysisType={analysisType}
          analysisResult={analysisResult}
          title={title}
          variant="outline"
          size="default"
          className="flex-1"
        />
        <ShareAnalysisToMessagesButton
          analysisId={analysisId}
          analysisType={analysisType}
          title={title}
          variant="outline"
          size="default"
          className="flex-1"
        />
      </div>
    </Card>
  );
};
