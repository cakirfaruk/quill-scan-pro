import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseDraftOptions {
  key: string;
  maxLength?: number;
  autoSaveDelay?: number;
  onRestore?: (draft: string) => void;
}

interface DraftData {
  content: string;
  timestamp: number;
}

const DRAFT_EXPIRY_DAYS = 7; // Drafts expire after 7 days

export const useDraft = ({
  key,
  maxLength = 5000,
  autoSaveDelay = 2000,
  onRestore,
}: UseDraftOptions) => {
  const { toast } = useToast();
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const storageKey = `draft_${key}`;

  // Check if draft exists on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setHasDraft(true);
    }
  }, [key]);

  // Load draft from localStorage
  const loadDraft = useCallback((): string | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const data: DraftData = JSON.parse(stored);
      
      // Check if draft is expired
      const expiryTime = DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - data.timestamp > expiryTime) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return data.content;
    } catch (error) {
      console.error("Error loading draft:", error);
      return null;
    }
  }, [storageKey]);

  // Save draft to localStorage
  const saveDraft = useCallback((content: string) => {
    try {
      if (!content.trim()) {
        // Don't save empty drafts
        localStorage.removeItem(storageKey);
        setHasDraft(false);
        return;
      }

      // Validate content length
      if (content.length > maxLength) {
        toast({
          title: "Taslak kaydedilemedi",
          description: `İçerik çok uzun (maksimum ${maxLength} karakter)`,
          variant: "destructive",
        });
        return;
      }

      const data: DraftData = {
        content: content.substring(0, maxLength), // Enforce max length
        timestamp: Date.now(),
      };

      localStorage.setItem(storageKey, JSON.stringify(data));
      setHasDraft(true);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Taslak kaydedilemedi",
        description: "Bir hata oluştu",
        variant: "destructive",
      });
    }
  }, [storageKey, maxLength, toast]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setLastSaved(null);
    } catch (error) {
      console.error("Error clearing draft:", error);
    }
  }, [storageKey]);

  // Restore draft
  const restoreDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      onRestore?.(draft);
      toast({
        title: "Taslak yüklendi",
        description: "Önceki taslağınız geri yüklendi",
      });
    }
    return draft;
  }, [loadDraft, onRestore, toast]);

  // Auto-save with debounce
  const autoSave = useCallback((content: string) => {
    const timeoutId = setTimeout(() => {
      saveDraft(content);
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [saveDraft, autoSaveDelay]);

  return {
    hasDraft,
    lastSaved,
    saveDraft,
    loadDraft,
    clearDraft,
    restoreDraft,
    autoSave,
  };
};
