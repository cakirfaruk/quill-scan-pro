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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Overall Summary Card */}
      <Card className="p-8 bg-gradient-to-br from-primary/5 via-accent/5 to-background border-2 border-primary/20 shadow-glow">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary to-primary-glow rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Genel Değerlendirme
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-foreground">
            {result.overallSummary}
          </p>
        </div>
      </Card>

      {/* Topics */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
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
              className="w-full p-6 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {expandedTopics.has(topicIndex) ? (
                    <ChevronDown className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-foreground">{topic.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {topic.summary}
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {topic.subTopics.length} alt başlık
              </div>
            </button>

            {/* Topic Content */}
            {expandedTopics.has(topicIndex) && (
              <div className="border-t border-border bg-gradient-subtle">
                {/* Topic Summary */}
                <div className="p-6 bg-secondary/30">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-success/10 rounded-lg mt-1">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-foreground mb-2">Genel Değerlendirme</h5>
                      <p className="text-foreground/90 leading-relaxed">{topic.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Sub Topics */}
                <div className="p-6 space-y-3">
                  <h5 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
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
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-1.5 bg-accent/10 rounded">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-accent" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-accent" />
                              )}
                            </div>
                            <span className="font-medium text-foreground">{subTopic.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {isExpanded ? "Gizle" : "Detayları Gör"}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="pl-7 space-y-2">
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                                  Bulgu
                                </p>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                  {subTopic.finding}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                                  Yorum
                                </p>
                                <p className="text-sm text-foreground leading-relaxed">
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
