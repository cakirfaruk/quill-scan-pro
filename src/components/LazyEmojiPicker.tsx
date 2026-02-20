import { lazy, Suspense } from "react";
import type { EmojiClickData } from "emoji-picker-react";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

interface LazyEmojiPickerProps {
  onEmojiClick: (emojiData: EmojiClickData) => void;
  theme?: "light" | "dark" | "auto";
  width?: number;
  height?: number;
}

export const LazyEmojiPicker = ({ onEmojiClick, theme, width, height }: LazyEmojiPickerProps) => {
  return (
    <Suspense fallback={<div className="w-[320px] h-[400px] flex items-center justify-center bg-background/80 rounded-lg"><span className="text-muted-foreground text-sm">Loading...</span></div>}>
      <EmojiPicker onEmojiClick={onEmojiClick} theme={theme as any} width={width} height={height} />
    </Suspense>
  );
};

// Re-export the type so consumers can still use it
export type { EmojiClickData };
