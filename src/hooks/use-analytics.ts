/**
 * React hook for analytics tracking
 */

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  trackEvent,
  trackPageView,
  trackClick,
  trackFeatureUse,
  trackFormSubmit,
  startSession,
  updateSession,
  endSession,
} from '@/utils/analytics';

export function useAnalytics() {
  const location = useLocation();

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname);
    updateSession();
  }, [location.pathname]);

  // Start session on mount
  useEffect(() => {
    startSession();

    // End session on unmount
    return () => {
      endSession();
    };
  }, []);

  // Memoized tracking functions
  const track = useCallback((
    eventType: string,
    eventName: string,
    eventData?: Record<string, any>
  ) => {
    trackEvent(eventType, eventName, eventData);
  }, []);

  const click = useCallback((elementName: string, elementData?: Record<string, any>) => {
    trackClick(elementName, elementData);
  }, []);

  const featureUse = useCallback((featureName: string, featureData?: Record<string, any>) => {
    trackFeatureUse(featureName, featureData);
  }, []);

  const formSubmit = useCallback((formName: string, formData?: Record<string, any>) => {
    trackFormSubmit(formName, formData);
  }, []);

  return {
    track,
    click,
    featureUse,
    formSubmit,
  };
}
