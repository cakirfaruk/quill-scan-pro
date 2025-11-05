import { useNavigate } from "react-router-dom";
import { usePageHistory } from "@/hooks/use-page-history";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { History, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export const PageHistory = () => {
  const navigate = useNavigate();
  const { history, clearHistory, removeItem } = usePageHistory();

  if (history.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <History className="w-5 h-5" />
          {history.length > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {history.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-background/95 backdrop-blur-sm">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>Son Ziyaretler</span>
          </div>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-6 px-2 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Temizle
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="max-h-[400px]">
          {history.map((item, index) => (
            <DropdownMenuItem
              key={`${item.path}-${item.timestamp}`}
              onClick={() => navigate(item.path)}
              className="flex items-start gap-3 py-3 cursor-pointer group"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg group-hover:bg-primary/20 transition-colors">
                {item.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.path);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground truncate">
                    {item.path}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(item.timestamp, {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
