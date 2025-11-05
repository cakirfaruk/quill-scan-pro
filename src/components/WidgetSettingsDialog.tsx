import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWidgets } from "@/hooks/use-widgets";
import { Pin, PinOff, RotateCcw, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface WidgetSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WidgetSettingsDialog = ({
  open,
  onOpenChange,
}: WidgetSettingsDialogProps) => {
  const { widgets, togglePin, resetWidgets, reorderWidgets } = useWidgets();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    reorderWidgets(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "analysis":
        return "Analiz";
      case "fortune":
        return "Fal";
      case "social":
        return "Sosyal";
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "analysis":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "fortune":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "social":
        return "bg-pink-500/10 text-pink-600 border-pink-500/20";
      default:
        return "bg-muted";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Widget Ayarları</DialogTitle>
          <DialogDescription>
            Hızlı erişim widget'larınızı özelleştirin. Sabitlediğiniz widget'lar ana sayfada görünür.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={resetWidgets}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Varsayılana Dön
          </Button>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {widgets.map((widget, index) => (
              <Card
                key={widget.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`transition-all cursor-move ${
                  draggedIndex === index ? "opacity-50 scale-95" : ""
                } ${
                  widget.isPinned
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/50"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${widget.color} flex items-center justify-center text-2xl flex-shrink-0 shadow-md`}
                    >
                      {widget.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {widget.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getCategoryColor(widget.category)}`}
                        >
                          {getCategoryLabel(widget.category)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {widget.description}
                      </p>
                    </div>

                    <Button
                      variant={widget.isPinned ? "default" : "outline"}
                      size="sm"
                      onClick={() => togglePin(widget.id)}
                      className="gap-2 flex-shrink-0"
                    >
                      {widget.isPinned ? (
                        <>
                          <Pin className="w-4 h-4" />
                          Sabitli
                        </>
                      ) : (
                        <>
                          <PinOff className="w-4 h-4" />
                          Sabitle
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 İpucu: Widget'ları sürükle-bırak ile yeniden sıralayabilirsiniz
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
