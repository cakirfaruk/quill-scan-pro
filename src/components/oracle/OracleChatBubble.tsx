import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "oracle";
  content: string;
  created_at: string;
}

interface OracleChatBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export const OracleChatBubble = ({ message, isStreaming }: OracleChatBubbleProps) => {
  const isOracle = message.role === "oracle";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3",
        isOracle ? "justify-start" : "justify-end"
      )}
    >
      {isOracle && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isOracle
            ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
            : "bg-primary text-primary-foreground"
        )}
      >
        <p className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap",
          isStreaming && "animate-pulse"
        )}>
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-purple-500 animate-pulse rounded" />
          )}
        </p>
        <p className={cn(
          "text-[10px] mt-1",
          isOracle ? "text-muted-foreground" : "text-primary-foreground/70"
        )}>
          {new Date(message.created_at).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {!isOracle && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
    </motion.div>
  );
};
