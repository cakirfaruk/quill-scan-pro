import { Button } from "@/components/ui/button";
import { Share2, Copy, Loader2 } from "lucide-react";
import { useShare } from "@/hooks/use-share";

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
}

export const ShareButton = ({
  title,
  text,
  url = window.location.href,
  variant = "outline",
  size = "default",
  className = "",
  showIcon = true,
}: ShareButtonProps) => {
  const { share, isSupported, isSharing } = useShare();

  const handleShare = async () => {
    await share({
      title,
      text,
      url,
    });
  };

  return (
    <Button
      onClick={handleShare}
      variant={variant}
      size={size}
      className={className}
      disabled={isSharing}
    >
      {isSharing ? (
        <Loader2 className={`${showIcon && size !== 'icon' ? 'mr-2' : ''} h-4 w-4 animate-spin`} />
      ) : showIcon ? (
        isSupported ? (
          <Share2 className={`${size !== 'icon' ? 'mr-2' : ''} h-4 w-4`} />
        ) : (
          <Copy className={`${size !== 'icon' ? 'mr-2' : ''} h-4 w-4`} />
        )
      ) : null}
      {size !== 'icon' && (isSupported ? 'Paylaş' : 'Kopyala')}
    </Button>
  );
};
