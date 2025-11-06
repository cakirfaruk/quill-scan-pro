import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncStatusBadgeProps {
  status: 'pending' | 'syncing' | 'success' | 'failed';
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const SyncStatusBadge = ({ 
  status, 
  size = 'sm',
  showIcon = true 
}: SyncStatusBadgeProps) => {
  const config = {
    pending: {
      icon: Clock,
      label: 'Bekliyor',
      variant: 'secondary' as const,
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    syncing: {
      icon: Loader2,
      label: 'Gönderiliyor',
      variant: 'secondary' as const,
      className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    success: {
      icon: CheckCircle2,
      label: 'Gönderildi',
      variant: 'secondary' as const,
      className: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    failed: {
      icon: XCircle,
      label: 'Başarısız',
      variant: 'destructive' as const,
      className: '',
    },
  };

  const { icon: Icon, label, variant, className } = config[status];

  return (
    <Badge 
      variant={variant}
      className={cn(
        "gap-1 font-medium",
        size === 'sm' && "text-[10px] px-1.5 py-0.5",
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(
          size === 'sm' ? "w-3 h-3" : "w-3.5 h-3.5",
          status === 'syncing' && "animate-spin"
        )} />
      )}
      {label}
    </Badge>
  );
};
