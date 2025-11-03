import { useNavigate } from "react-router-dom";
import { parseText, ParsedTextSegment } from "@/utils/textParsing";
import { cn } from "@/lib/utils";

interface ParsedTextProps {
  text: string;
  className?: string;
  onHashtagClick?: (tag: string) => void;
}

export const ParsedText = ({ text, className, onHashtagClick }: ParsedTextProps) => {
  const navigate = useNavigate();
  const segments = parseText(text);

  const handleMentionClick = (username: string) => {
    navigate(`/profile/${username}`);
  };

  const handleHashtagClick = (tag: string) => {
    if (onHashtagClick) {
      onHashtagClick(tag);
    } else {
      navigate(`/explore?hashtag=${tag}`);
    }
  };

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case 'mention':
            return (
              <button
                key={index}
                onClick={() => handleMentionClick(segment.username!)}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                {segment.content}
              </button>
            );
          
          case 'hashtag':
            return (
              <button
                key={index}
                onClick={() => handleHashtagClick(segment.tag!)}
                className="text-accent font-semibold hover:underline cursor-pointer"
              >
                {segment.content}
              </button>
            );
          
          case 'link':
            return (
              <a
                key={index}
                href={segment.url}
                onClick={(e) => handleLinkClick(segment.url!, e)}
                className="text-blue-500 hover:underline cursor-pointer"
                target="_blank"
                rel="noopener noreferrer"
              >
                {segment.content}
              </a>
            );
          
          default:
            return <span key={index}>{segment.content}</span>;
        }
      })}
    </span>
  );
};
