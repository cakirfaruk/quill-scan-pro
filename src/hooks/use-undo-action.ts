import { useState, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";

export type UndoActionType = 
  | "delete_post"
  | "delete_friend"
  | "accept_friend"
  | "reject_friend"
  | "send_friend_request"
  | "delete_comment"
  | "unlike_post";

interface UndoAction {
  id: string;
  type: UndoActionType;
  description: string;
  undo: () => Promise<void>;
  timestamp: number;
}

const UNDO_TIMEOUT = 5000; // 5 seconds

export const useUndoAction = () => {
  const [actionHistory, setActionHistory] = useState<UndoAction[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const clearActionTimeout = useCallback((actionId: string) => {
    const timeout = timeoutRefs.current.get(actionId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(actionId);
    }
  }, []);

  const removeAction = useCallback((actionId: string) => {
    setActionHistory(prev => prev.filter(a => a.id !== actionId));
    clearActionTimeout(actionId);
  }, [clearActionTimeout]);

  const performUndo = useCallback(async (
    undoFn: () => Promise<void>,
    actionId: string,
    dismissFn: () => void
  ) => {
    try {
      await undoFn();
      removeAction(actionId);
      dismissFn();
      toast({
        title: "Geri alındı",
        description: "İşlem geri alındı",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "İşlem geri alınamadı",
        variant: "destructive",
      });
    }
  }, [removeAction]);

  const registerAction = useCallback((
    type: UndoActionType,
    description: string,
    undoFn: () => Promise<void>,
    onComplete?: () => Promise<void>
  ) => {
    const actionId = `${type}_${Date.now()}_${Math.random()}`;
    
    const action: UndoAction = {
      id: actionId,
      type,
      description,
      undo: undoFn,
      timestamp: Date.now(),
    };

    setActionHistory(prev => [action, ...prev].slice(0, 10)); // Keep max 10 actions

    // Auto-dismiss after timeout and execute the completion callback
    const timeout = setTimeout(async () => {
      removeAction(actionId);
      if (onComplete) {
        await onComplete();
      }
    }, UNDO_TIMEOUT);

    timeoutRefs.current.set(actionId, timeout);

    return {
      actionId,
      undoFn,
      performUndo: (dismissFn: () => void) => performUndo(undoFn, actionId, dismissFn),
    };
  }, [removeAction, performUndo]);

  return {
    actionHistory,
    registerAction,
  };
};
