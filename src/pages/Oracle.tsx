import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Send, Trash2, MessageCircle, Sun, Heart, Briefcase, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OracleChatBubble } from "@/components/oracle/OracleChatBubble";
import { OracleQuickActions } from "@/components/oracle/OracleQuickActions";
import { OracleDailyLimit } from "@/components/oracle/OracleDailyLimit";
import { OracleTypingIndicator } from "@/components/oracle/OracleTypingIndicator";
import { OracleCrystalBall } from "@/components/oracle/OracleCrystalBall";

interface Message {
  id: string;
  role: "user" | "oracle";
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export default function Oracle() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [freeQuestionsRemaining, setFreeQuestionsRemaining] = useState(3);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadDailyUsage();
    }
  }, [user]);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadConversations = async () => {
    const { data } = await supabase
      .from("oracle_conversations")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (data) setConversations(data);
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from("oracle_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    if (data) {
      setMessages(data.map(m => ({
        ...m,
        role: m.role as "user" | "oracle"
      })));
    }
  };

  const loadDailyUsage = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("oracle_daily_usage")
      .select("free_questions_used")
      .eq("user_id", user?.id)
      .eq("date", today)
      .single();
    
    const used = data?.free_questions_used || 0;
    setFreeQuestionsRemaining(Math.max(0, 3 - used));
  };

  const sendMessage = useCallback(async (message: string, quickAction?: string) => {
    if ((!message.trim() && !quickAction) || isStreaming) return;

    const userMessage = message.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    // Optimistically add user message
    if (!quickAction) {
      const tempUserMsg: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: userMessage,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempUserMsg]);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oracle-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: activeConversationId,
          quickAction,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          toast.error("Ücretsiz sorularınız bitti. Devam etmek için kredi gerekiyor.");
          setFreeQuestionsRemaining(0);
        } else {
          toast.error(errorData.error || "Bir hata oluştu");
        }
        setIsStreaming(false);
        return;
      }

      // Get conversation ID from header
      const newConvId = response.headers.get("X-Conversation-Id");
      const remaining = response.headers.get("X-Free-Questions-Remaining");
      
      if (newConvId && !activeConversationId) {
        setActiveConversationId(newConvId);
        loadConversations();
      }
      
      if (remaining !== null) {
        setFreeQuestionsRemaining(parseInt(remaining));
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                accumulatedContent += content;
                setStreamingContent(accumulatedContent);
              }
            } catch {
              // ignore
            }
          }
        }
      }

      // Add completed message
      if (accumulatedContent) {
        const oracleMsg: Message = {
          id: `oracle-${Date.now()}`,
          role: "oracle",
          content: accumulatedContent,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, oracleMsg]);
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  }, [activeConversationId, isStreaming]);

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setShowHistory(false);
  };

  const deleteConversation = async (convId: string) => {
    await supabase.from("oracle_conversations").delete().eq("id", convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConversationId === convId) {
      startNewConversation();
    }
    toast.success("Sohbet silindi");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-950 via-background to-background">
        <OracleCrystalBall animate />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-background to-background">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/30">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="text-muted-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">Mystic Oracle</h1>
                <p className="text-xs text-muted-foreground">Yıldızların bilgeliği</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <OracleDailyLimit remaining={freeQuestionsRemaining} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
              className="text-muted-foreground"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto relative">
        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="absolute inset-0 z-40 bg-background/95 backdrop-blur-lg"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Geçmiş Sohbetler</h2>
                  <Button variant="outline" size="sm" onClick={startNewConversation}>
                    Yeni Sohbet
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-3 rounded-lg cursor-pointer flex items-center justify-between group ${
                          conv.id === activeConversationId
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-card hover:bg-card/80"
                        }`}
                        onClick={() => {
                          setActiveConversationId(conv.id);
                          setShowHistory(false);
                        }}
                      >
                        <div className="truncate flex-1">
                          <p className="text-sm font-medium truncate">{conv.title || "Yeni Sohbet"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(conv.created_at).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {conversations.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Henüz sohbet yok
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex flex-col h-[calc(100vh-80px)]">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 && !isStreaming ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <OracleCrystalBall animate />
                <h2 className="text-xl font-semibold mt-6 mb-2">Merhaba, Yolcu</h2>
                <p className="text-muted-foreground text-center max-w-sm mb-8">
                  Ben Stellara'nın mistik Oracle'ıyım. Yıldızların bilgeliğiyle sorularını yanıtlamak için buradayım.
                </p>
                <OracleQuickActions onAction={(action) => sendMessage("", action)} />
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {messages.map((msg) => (
                  <OracleChatBubble key={msg.id} message={msg} />
                ))}
                {isStreaming && streamingContent && (
                  <OracleChatBubble
                    message={{
                      id: "streaming",
                      role: "oracle",
                      content: streamingContent,
                      created_at: new Date().toISOString(),
                    }}
                    isStreaming
                  />
                )}
                {isStreaming && !streamingContent && (
                  <OracleTypingIndicator />
                )}
              </div>
            )}
          </ScrollArea>

          {/* Quick Actions when in conversation */}
          {messages.length > 0 && !isStreaming && (
            <div className="px-4 pb-2">
              <OracleQuickActions onAction={(action) => sendMessage("", action)} compact />
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-border/30 bg-background/60 backdrop-blur-lg">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Oracle'a sor..."
                className="min-h-[44px] max-h-32 resize-none bg-card/50 border-border/50"
                disabled={isStreaming}
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="h-11 w-11 shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            {freeQuestionsRemaining === 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Ücretsiz sorularınız bitti. Her soru 1 kredi.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
