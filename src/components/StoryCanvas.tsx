import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage, FabricText, IText, Shadow } from "fabric";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { usePinch } from "@/hooks/use-gestures";

// Extend FabricObject to include custom data
declare module "fabric" {
  interface FabricObject {
    data?: {
      type?: string;
      index?: number;
      animation?: string;
    };
  }
}

interface StoryCanvasProps {
  backgroundImage: string;
  mediaType: "photo" | "video";
  stickers: Array<{ emoji: string; x: number; y: number; size: number }>;
  gifs: Array<{ url: string; x: number; y: number }>;
  textElements: Array<{ text: string; font: string; color: string; size: number; animation: string; x: number; y: number }>;
  onElementsUpdate: (data: {
    stickers: Array<{ emoji: string; x: number; y: number; size: number }>;
    gifs: Array<{ url: string; x: number; y: number }>;
    textElements: Array<{ text: string; font: string; color: string; size: number; animation: string; x: number; y: number }>;
  }) => void;
}

export const StoryCanvas = ({
  backgroundImage,
  mediaType,
  stickers,
  gifs,
  textElements,
  onElementsUpdate,
}: StoryCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const elementRefs = useRef<Map<string, any>>(new Map());
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const initialScaleRef = useRef<number>(1);

  // Pinch-to-zoom gesture for selected object with scale limits
  const pinchGestures = usePinch({
    onPinchStart: () => {
      if (selectedObject && selectedObject.scaleX) {
        initialScaleRef.current = selectedObject.scaleX;
      }
    },
    onPinch: (scale) => {
      if (fabricCanvas && selectedObject) {
        // Apply scale limits: min 0.5x, max 3.0x
        const newScale = Math.min(3.0, Math.max(0.5, initialScaleRef.current * scale));
        selectedObject.set({
          scaleX: newScale,
          scaleY: newScale,
        });
        fabricCanvas.renderAll();
      }
    },
    onPinchEnd: () => {
      updateElementPositions();
    },
  });

  // Initialize canvas with responsive sizing
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Responsive canvas width: min(400px, 90vw)
    const containerWidth = containerRef.current.clientWidth;
    const canvasWidth = Math.min(400, containerWidth * 0.9);
    const canvasHeight = Math.round(canvasWidth * (16 / 9)); // 9:16 aspect ratio

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#000000",
    });

    // Listen for selection changes
    canvas.on("selection:created", (e) => {
      setSelectedObject(e.selected?.[0]);
    });

    canvas.on("selection:updated", (e) => {
      setSelectedObject(e.selected?.[0]);
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Load background image
  useEffect(() => {
    if (!fabricCanvas || !backgroundImage) return;

    FabricImage.fromURL(backgroundImage, {
      crossOrigin: "anonymous",
    }).then((img) => {
      if (!img) return;

      const canvasWidth = fabricCanvas.getWidth();
      const canvasHeight = fabricCanvas.getHeight();
      img.scaleToWidth(canvasWidth);
      img.scaleToHeight(canvasHeight);
      img.selectable = false;
      img.evented = false;
      
      fabricCanvas.backgroundImage = img;
      fabricCanvas.renderAll();
    });
  }, [fabricCanvas, backgroundImage]);

  // Add stickers
  useEffect(() => {
    if (!fabricCanvas) return;

    // Remove old stickers
    fabricCanvas.getObjects().forEach((obj) => {
      if (obj.data?.type === "sticker") {
        fabricCanvas.remove(obj);
      }
    });

    // Add new stickers
    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();
    
    stickers.forEach((sticker, index) => {
      const text = new IText(sticker.emoji, {
        left: (sticker.x / 100) * canvasWidth,
        top: (sticker.y / 100) * canvasHeight,
        fontSize: Math.max(sticker.size, 44), // Min touch target 44px
        selectable: true,
        hasControls: true,
        hasBorders: true,
        data: { type: "sticker", index },
      });

      text.on("modified", () => updateElementPositions());
      fabricCanvas.add(text);
      elementRefs.current.set(`sticker-${index}`, text);
    });

    fabricCanvas.renderAll();
  }, [fabricCanvas, stickers]);

  // Add GIFs
  useEffect(() => {
    if (!fabricCanvas) return;

    // Remove old GIFs
    fabricCanvas.getObjects().forEach((obj) => {
      if (obj.data?.type === "gif") {
        fabricCanvas.remove(obj);
      }
    });

    // Add new GIFs
    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();
    
    gifs.forEach((gif, index) => {
      FabricImage.fromURL(gif.url, {
        crossOrigin: "anonymous",
      }).then((img) => {
        if (!img) return;

        img.set({
          left: (gif.x / 100) * canvasWidth,
          top: (gif.y / 100) * canvasHeight,
          scaleX: 0.3,
          scaleY: 0.3,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          data: { type: "gif", index },
        });

        img.on("modified", () => updateElementPositions());
        fabricCanvas.add(img);
        elementRefs.current.set(`gif-${index}`, img);
        fabricCanvas.renderAll();
      });
    });
  }, [fabricCanvas, gifs]);

  // Add text elements
  useEffect(() => {
    if (!fabricCanvas) return;

    // Remove old text elements
    fabricCanvas.getObjects().forEach((obj) => {
      if (obj.data?.type === "text") {
        fabricCanvas.remove(obj);
      }
    });

    // Add new text elements
    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();
    
    textElements.forEach((textEl, index) => {
      const text = new IText(textEl.text, {
        left: (textEl.x / 100) * canvasWidth,
        top: (textEl.y / 100) * canvasHeight,
        fontSize: textEl.size,
        fill: textEl.color,
        fontFamily: textEl.font,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        shadow: new Shadow({
          color: "rgba(0,0,0,0.5)",
          blur: 4,
          offsetX: 2,
          offsetY: 2,
        }),
        data: { type: "text", index, animation: textEl.animation },
      });

      text.on("modified", () => updateElementPositions());
      fabricCanvas.add(text);
      elementRefs.current.set(`text-${index}`, text);
    });

    fabricCanvas.renderAll();
  }, [fabricCanvas, textElements]);

  const updateElementPositions = () => {
    if (!fabricCanvas) return;

    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();
    const updatedStickers: typeof stickers = [];
    const updatedGifs: typeof gifs = [];
    const updatedTexts: typeof textElements = [];

    fabricCanvas.getObjects().forEach((obj) => {
      if (obj.data?.type === "sticker") {
        const index = obj.data.index;
        const originalSticker = stickers[index];
        if (originalSticker && obj.left !== undefined && obj.top !== undefined) {
          updatedStickers.push({
            ...originalSticker,
            x: (obj.left / canvasWidth) * 100,
            y: (obj.top / canvasHeight) * 100,
          });
        }
      } else if (obj.data?.type === "gif") {
        const index = obj.data.index;
        const originalGif = gifs[index];
        if (originalGif && obj.left !== undefined && obj.top !== undefined) {
          updatedGifs.push({
            ...originalGif,
            x: (obj.left / canvasWidth) * 100,
            y: (obj.top / canvasHeight) * 100,
          });
        }
      } else if (obj.data?.type === "text") {
        const index = obj.data.index;
        const originalText = textElements[index];
        if (originalText && obj.left !== undefined && obj.top !== undefined) {
          updatedTexts.push({
            ...originalText,
            text: (obj as IText).text || originalText.text,
            x: (obj.left / canvasWidth) * 100,
            y: (obj.top / canvasHeight) * 100,
          });
        }
      }
    });

    onElementsUpdate({
      stickers: updatedStickers,
      gifs: updatedGifs,
      textElements: updatedTexts,
    });
  };

  const handleDeleteSelected = () => {
    if (!fabricCanvas || !selectedObject) return;

    fabricCanvas.remove(selectedObject);
    setSelectedObject(null);
    fabricCanvas.renderAll();
    updateElementPositions();
  };

  return (
    <div className="space-y-2">
      <div 
        ref={containerRef}
        className="relative w-full flex items-center justify-center bg-black rounded-lg overflow-hidden touch-none"
        {...pinchGestures}
      >
        <canvas ref={canvasRef} className="max-w-full" />
        
        {/* Help text */}
        {stickers.length === 0 && gifs.length === 0 && textElements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-white/70 text-sm text-center px-4">
              Sticker, GIF veya metin ekleyin<br />
              Sürükleyerek konumlandırın<br />
              <span className="text-xs">2 parmakla boyutlandırın</span>
            </p>
          </div>
        )}
      </div>

      {/* Delete button */}
      {selectedObject && (
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={handleDeleteSelected}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Seçili Öğeyi Sil
        </Button>
      )}
    </div>
  );
};
