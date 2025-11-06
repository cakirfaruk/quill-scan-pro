import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ShareResultButton } from "@/components/ShareResultButton";

export interface SubTopic {
  name: string;
  finding: string;
  interpretation: string;
}

export interface Topic {
  name: string;
  subTopics: SubTopic[];
  summary: string;
}

export interface AnalysisResult {
  topics: Topic[];
  overallSummary: string;
}

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export const AnalysisResults = ({ result }: AnalysisResultsProps) => {
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set([0]));
  const [expandedSubTopics, setExpandedSubTopics] = useState<Set<string>>(new Set());

  const toggleTopic = (index: number) => {
    setExpandedTopics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleSubTopic = (key: string) => {
    setExpandedSubTopics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overall Summary Card */}
      <Card className="p-3 bg-gradient-to-br from-primary/5 via-accent/5 to-background border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Özet
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-foreground">
          {result.overallSummary}
        </p>
      </Card>

      {/* Topics Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-primary" />
          Detaylar
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
        {result.topics.map((topic, topicIndex) => (
          <button
            key={topicIndex}
            onClick={() => toggleTopic(topicIndex)}
            className="p-3 bg-card border border-border rounded-lg hover:bg-secondary/50 transition-colors flex flex-col items-center justify-center gap-2 text-center min-h-[100px]"
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              {expandedTopics.has(topicIndex) ? (
                <ChevronDown className="w-5 h-5 text-primary" />
              ) : (
                <ChevronRight className="w-5 h-5 text-primary" />
              )}
            </div>
            <h4 className="text-xs font-semibold text-foreground">{topic.name}</h4>
          </button>

        ))}
        </div>
        
        {/* Expanded Topic Details */}
        {Array.from(expandedTopics).map((topicIndex) => {
          const topic = result.topics[topicIndex];
          if (!topic) return null;
          
          return (
            <Card key={`expanded-${topicIndex}`} className="p-3 space-y-3">
              <div className="flex items-start gap-2">
                <div className="p-1 bg-success/10 rounded mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground mb-1">{topic.name}</h4>
                  <p className="text-xs text-foreground/90 leading-relaxed">{topic.summary}</p>
                </div>
              </div>

              {/* Sub Topics */}
              <div className="space-y-2">
                {topic.subTopics.map((subTopic, subIndex) => {
                  const subKey = `${topicIndex}-${subIndex}`;
                  const isExpanded = expandedSubTopics.has(subKey);

                  return (
                    <div
                      key={subIndex}
                      className="bg-card rounded border border-border overflow-hidden"
                    >
                      <button
                        onClick={() => toggleSubTopic(subKey)}
                        className="w-full p-2 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <div className="p-0.5 bg-accent/10 rounded flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 text-accent" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-accent" />
                            )}
                          </div>
                          <span className="text-xs font-medium text-foreground truncate">{subTopic.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-1.5 flex-shrink-0">
                          {isExpanded ? "−" : "+"}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="px-2 pb-2 space-y-1.5">
                          <div className="pl-3 space-y-1">
                            <div>
                               <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                                Bulgu
                              </p>
                              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                {subTopic.finding}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                                Yorum
                              </p>
                              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                                {subTopic.interpretation}
                              </p>
                              
                              {/* Share button for this subtopic */}
                              <div className="mt-2 pt-2 border-t border-border">
                                <ShareResultButton
                                  title={`${topic.name} - ${subTopic.name}`}
                                  content={`**${subTopic.name}**\n\nBulgu: ${subTopic.finding}\n\nYorum: ${subTopic.interpretation}`}
                                  size="sm"
                                  variant="ghost"
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
