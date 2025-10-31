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
    <div className="space-y-4 sm:space-y-5 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Overall Summary Card */}
      <Card className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-primary/5 via-accent/5 to-background border-2 border-primary/20 shadow-glow">
        <div className="space-y-3 sm:space-y-3.5 md:space-y-4">
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
            <div className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Genel Değerlendirme
            </h2>
          </div>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-foreground">
            {result.overallSummary}
          </p>
        </div>
      </Card>

      {/* Topics */}
      <div className="space-y-3 sm:space-y-3.5 md:space-y-4">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
          <AlertCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-primary" />
          Detaylı Analiz Sonuçları
        </h3>
        
        {result.topics.map((topic, topicIndex) => (
          <Card
            key={topicIndex}
            className="overflow-hidden transition-all duration-300 hover:shadow-card border-l-4 border-l-primary"
          >
            {/* Topic Header */}
            <button
              onClick={() => toggleTopic(topicIndex)}
              className="w-full p-4 sm:p-5 md:p-6 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                <div className="p-1.5 sm:p-1.5 md:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  {expandedTopics.has(topicIndex) ? (
                    <ChevronDown className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-primary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base sm:text-base md:text-lg font-semibold text-foreground truncate">{topic.name}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                    {topic.summary}
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-muted px-2 sm:px-2.5 md:px-3 py-1 rounded-full ml-2 flex-shrink-0">
                <span className="hidden sm:inline">{topic.subTopics.length} alt başlık</span>
                <span className="sm:hidden">{topic.subTopics.length}</span>
              </div>
            </button>

            {/* Topic Content */}
            {expandedTopics.has(topicIndex) && (
              <div className="border-t border-border bg-gradient-subtle">
                {/* Topic Summary */}
                <div className="p-4 sm:p-5 md:p-6 bg-secondary/30">
                  <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
                    <div className="p-1.5 sm:p-1.5 md:p-2 bg-success/10 rounded-lg mt-0.5 sm:mt-0.5 md:mt-1 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm sm:text-base font-semibold text-foreground mb-1.5 sm:mb-2">Genel Değerlendirme</h5>
                      <p className="text-xs sm:text-sm md:text-base text-foreground/90 leading-relaxed">{topic.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Sub Topics */}
                <div className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-2.5 md:space-y-3">
                  <h5 className="font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">
                    Alt Başlıklar
                  </h5>
                  {topic.subTopics.map((subTopic, subIndex) => {
                    const subKey = `${topicIndex}-${subIndex}`;
                    const isExpanded = expandedSubTopics.has(subKey);

                    return (
                      <div
                        key={subIndex}
                        className="bg-card rounded-lg border border-border overflow-hidden transition-all duration-300 hover:border-primary/50"
                      >
                        <button
                          onClick={() => toggleSubTopic(subKey)}
                          className="w-full p-3 sm:p-3.5 md:p-4 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 flex-1 min-w-0">
                            <div className="p-1 sm:p-1.5 bg-accent/10 rounded flex-shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                              )}
                            </div>
                            <span className="text-sm sm:text-base font-medium text-foreground truncate">{subTopic.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            <span className="hidden sm:inline">{isExpanded ? "Gizle" : "Detayları Gör"}</span>
                            <span className="sm:hidden">{isExpanded ? "−" : "+"}</span>
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-3 sm:px-3.5 md:px-4 pb-3 sm:pb-3.5 md:pb-4 space-y-2 sm:space-y-2.5 md:space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="pl-4 sm:pl-5 md:pl-7 space-y-1.5 sm:space-y-2">
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-0.5 sm:mb-1">
                                  Bulgu
                                </p>
                                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                                  {subTopic.finding}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-0.5 sm:mb-1">
                                  Yorum
                                </p>
                                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
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
