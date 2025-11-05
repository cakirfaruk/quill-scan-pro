import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Settings, Sparkles } from "lucide-react";
import { useWidgets } from "@/hooks/use-widgets";
import { useState } from "react";
import { WidgetSettingsDialog } from "./WidgetSettingsDialog";

export const WidgetDashboard = () => {
  const navigate = useNavigate();
  const { pinnedWidgets } = useWidgets();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (pinnedWidgets.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Hızlı Erişim</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="h-8 w-8 p-0"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {pinnedWidgets.map((widget) => (
              <Card
                key={widget.id}
                className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border/50 hover:border-primary/50"
                onClick={() => navigate(widget.path)}
              >
                <CardContent className="p-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${widget.color} flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-md`}
                  >
                    {widget.icon}
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                    {widget.title}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <WidgetSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};
