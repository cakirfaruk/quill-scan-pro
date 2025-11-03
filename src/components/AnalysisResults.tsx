import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

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
    <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Overall Summary Card */}
      <Card className="p-3 sm:p-4 bg-gradient-to-br from-primary/5 via-accent/5 to-background border border-primary/20">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Özet
            </h2>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-foreground line-clamp-3">
            {result.overallSummary}
          </p>
        </div>
      </Card>

      {/* Topics */}
      <div className="space-y-2 sm:space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          Detaylar
        </h3>
        
        {result.topics.map((topic, topicIndex) => (
          <Card
            key={topicIndex}
            className="overflow-hidden transition-all duration-200 border-l-2 border-l-primary"
          >
            {/* Topic Header */}
            <button
              onClick={() => toggleTopic(topicIndex)}
              className="w-full p-2.5 sm:p-3 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                <div className="p-1 bg-primary/10 rounded flex-shrink-0">
                  {expandedTopics.has(topicIndex) ? (
                    <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                  ) : (
                    <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">{topic.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {topic.summary}
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded-full ml-1.5 flex-shrink-0">
                {topic.subTopics.length}
              </div>
            </button>

            {/* Topic Content */}
            {expandedTopics.has(topicIndex) && (
              <div className="border-t border-border">
                {/* Topic Summary */}
                <div className="p-2.5 sm:p-3 bg-secondary/20">
                  <div className="flex items-start gap-1.5 sm:gap-2">
                    <div className="p-1 bg-success/10 rounded mt-0.5 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">{topic.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Sub Topics */}
                <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
                  {topic.subTopics.map((subTopic, subIndex) => {
                    const subKey = `${topicIndex}-${subIndex}`;
                    const isExpanded = expandedSubTopics.has(subKey);

                    return (
                      <div
                        key={subIndex}
                        className="bg-card rounded border border-border overflow-hidden transition-all duration-200"
                      >
                        <button
                          onClick={() => toggleSubTopic(subKey)}
                          className="w-full p-2 sm:p-2.5 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <div className="p-0.5 bg-accent/10 rounded flex-shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-accent" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-accent" />
                              )}
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-foreground truncate">{subTopic.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground ml-1.5 flex-shrink-0">
                            {isExpanded ? "−" : "+"}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-2 sm:px-2.5 pb-2 sm:pb-2.5 space-y-1.5 animate-in fade-in duration-200">
                            <div className="pl-3 sm:pl-4 space-y-1">
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                                  Bulgu
                                </p>
                                <p className="text-xs text-foreground/80 leading-relaxed">
                                  {subTopic.finding}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                                  Yorum
                                </p>
                                <p className="text-xs text-foreground leading-relaxed">
                                  {subTopic.interpretation}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
