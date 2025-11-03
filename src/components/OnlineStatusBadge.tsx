import { useOnlineStatus } from "@/hooks/use-online-status";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface OnlineStatusBadgeProps {
  userId: string;
  showLastSeen?: boolean;
  size?: "sm" | "md" | "lg";
}

export const OnlineStatusBadge = ({ 
  userId, 
  showLastSeen = true,
  size = "md" 
}: OnlineStatusBadgeProps) => {
  const { isOnline, lastSeen } = useOnlineStatus(userId);

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  if (!showLastSeen && !isOnline) return null;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`${sizeClasses[size]} rounded-full ${
          isOnline ? "bg-green-500" : "bg-gray-400"
        } ring-2 ring-background`}
      />
      {showLastSeen && !isOnline && lastSeen && (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(lastSeen), {
            addSuffix: true,
            locale: tr,
          })}
        </span>
      )}
      {showLastSeen && isOnline && (
        <span className="text-xs text-green-600 font-medium">Çevrimiçi</span>
      )}
    </div>
  );
};
