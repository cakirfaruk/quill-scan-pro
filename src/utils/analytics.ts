/**
 * Analytics and monitoring utilities
 * Track user behavior, errors, and performance metrics
 */

import { supabase } from '@/integrations/supabase/client';

// Generate or retrieve session ID
let sessionId: string | null = null;

export function getSessionId(): string {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
  }
  return sessionId;
}

// Track user behavior events
export async function trackEvent(
  eventType: string,
  eventName: string,
  eventData?: Record<string, any>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('analytics_events').insert({
      user_id: user?.id || null,
      event_type: eventType,
      event_name: eventName,
      event_data: eventData || {},
      page_path: window.location.pathname,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      session_id: getSessionId(),
    });
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.debug('Analytics tracking failed:', error);
  }
}

// Track page views
export function trackPageView(pagePath?: string) {
  trackEvent('page_view', 'Page View', {
    path: pagePath || window.location.pathname,
    title: document.title,
  });
}

// Track clicks
export function trackClick(elementName: string, elementData?: Record<string, any>) {
  trackEvent('click', `Click: ${elementName}`, elementData);
}

// Track feature usage
export function trackFeatureUse(featureName: string, featureData?: Record<string, any>) {
  trackEvent('feature_use', `Feature: ${featureName}`, featureData);
}

// Track form submissions
export function trackFormSubmit(formName: string, formData?: Record<string, any>) {
  trackEvent('form_submit', `Form: ${formName}`, formData);
}

// Track API calls
export async function trackAPICall(
  endpoint: string,
  method: string,
  duration: number,
  status: number
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('performance_metrics').insert({
      user_id: user?.id || null,
      url: window.location.href,
      metric_name: `${method} ${endpoint}`,
      metric_value: duration,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.debug('API tracking failed:', error);
  }
}

// Track performance metrics
export async function trackPerformanceMetric(
  metricName: string,
  metricValue: number
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('performance_metrics').insert({
      user_id: user?.id || null,
      url: window.location.href,
      metric_name: metricName,
      metric_value: metricValue,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.debug('Performance metric tracking failed:', error);
  }
}

// Log errors to database
export async function logError(
  errorMessage: string,
  errorStack?: string,
  errorType: string = 'Error',
  severity: 'error' | 'warning' | 'critical' = 'error',
  context?: Record<string, any>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('error_logs').insert({
      user_id: user?.id || null,
      error_message: errorMessage,
      error_stack: errorStack || '',
      error_type: errorType,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      severity,
      context: context || {},
      browser_info: {
        language: navigator.language,
        platform: navigator.platform,
        userAgent: navigator.userAgent,
      },
    });
  } catch (error) {
    console.debug('Error logging failed:', error);
  }
}

// Start session tracking
export async function startSession() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const sid = getSessionId();
    
    await supabase.from('user_sessions').upsert({
      user_id: user?.id || null,
      session_id: sid,
      started_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      last_page: window.location.pathname,
      page_views: 1,
      events_count: 0,
    }, {
      onConflict: 'session_id',
    });
  } catch (error) {
    console.debug('Session start failed:', error);
  }
}

// Update session
export async function updateSession() {
  try {
    const sid = getSessionId();
    
    const { data: session } = await supabase
      .from('user_sessions')
      .select('page_views, events_count, started_at')
      .eq('session_id', sid)
      .single();
    
    if (session) {
      const duration = Math.floor(
        (new Date().getTime() - new Date(session.started_at).getTime()) / 1000
      );
      
      await supabase
        .from('user_sessions')
        .update({
          last_page: window.location.pathname,
          page_views: (session.page_views || 0) + 1,
          duration_seconds: duration,
        })
        .eq('session_id', sid);
    }
  } catch (error) {
    console.debug('Session update failed:', error);
  }
}

// End session
export async function endSession() {
  try {
    const sid = getSessionId();
    
    const { data: session } = await supabase
      .from('user_sessions')
      .select('started_at')
      .eq('session_id', sid)
      .single();
    
    if (session) {
      const duration = Math.floor(
        (new Date().getTime() - new Date(session.started_at).getTime()) / 1000
      );
      
      await supabase
        .from('user_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
        })
        .eq('session_id', sid);
    }
  } catch (error) {
    console.debug('Session end failed:', error);
  }
}
