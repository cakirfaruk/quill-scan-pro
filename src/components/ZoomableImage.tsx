import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePinch } from "@/hooks/use-gestures";
import { cn } from "@/lib/utils";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const ZoomableImage = ({ src, alt, className }: ZoomableImageProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const lastScale = useRef(1);

  const pinchGestures = usePinch({
    onPinch: (newScale) => {
      const finalScale = Math.min(Math.max(lastScale.current * newScale, 1), 5);
      setScale(finalScale);
    },
    onPinchStart: () => {
      lastScale.current = scale;
    },
    onPinchEnd: () => {
      lastScale.current = scale;
    },
  });

  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.5, 5));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.5, 1));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      touchStart.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
    pinchGestures.onTouchStart(e);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isDragging && touchStart.current && scale > 1) {
      const newX = e.touches[0].clientX - touchStart.current.x;
      const newY = e.touches[0].clientY - touchStart.current.y;
      setPosition({ x: newX, y: newY });
    }
    pinchGestures.onTouchMove(e);
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    pinchGestures.onTouchEnd();
  };

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={cn("cursor-zoom-in transition-transform hover:scale-[1.02]", className)}
        onClick={() => setIsOpen(true)}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-full h-full p-0 bg-black/95 border-0">
          <div className="relative w-full h-full overflow-hidden">
            {/* Controls */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                onClick={handleZoomIn}
                disabled={scale >= 5}
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                onClick={handleZoomOut}
                disabled={scale <= 1}
              >
                <ZoomOut className="w-5 h-5 text-white" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                onClick={handleReset}
              >
                <Maximize2 className="w-5 h-5 text-white" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5 text-white" />
              </Button>
            </div>

            {/* Zoom indicator */}
            <div className="absolute top-4 left-4 z-50 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="text-white text-sm font-medium">
                {Math.round(scale * 100)}%
              </span>
            </div>

            {/* Image */}
            <div
              ref={imageRef}
              className="w-full h-full flex items-center justify-center"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={src}
                alt={alt}
                className={cn(
                  "max-w-full max-h-full object-contain transition-transform duration-200",
                  isDragging ? "cursor-grabbing" : scale > 1 ? "cursor-grab" : "cursor-default"
                )}
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                }}
                draggable={false}
              />
            </div>

            {/* Instructions */}
            {!pinchGestures.isPinching && scale === 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full animate-fade-in">
                <p className="text-white text-sm text-center">
                  📌 İki parmakla yakınlaştır / uzaklaştır
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
