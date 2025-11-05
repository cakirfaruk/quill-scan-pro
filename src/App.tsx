import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { RouteProgressBar } from "@/components/AnimationWrappers";
import { EnhancedOfflineIndicator } from "@/components/EnhancedOfflineIndicator";
import { Tutorial } from "@/components/Tutorial";
import { MobileNav } from "@/components/MobileNav";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { useUpdateOnlineStatus } from "@/hooks/use-online-status";
import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IncomingCallDialog } from "@/components/IncomingCallDialog";
import { IncomingGroupCallDialog } from "@/components/IncomingGroupCallDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useErrorAlerts } from "@/hooks/use-error-alerts";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";

// Lazy load ALL pages including Index for optimal code splitting
const Index = lazy(() => import("./pages/Index"));

// Lazy load routes for better performance
const Auth = lazy(() => import("./pages/Auth"));
const Credits = lazy(() => import("./pages/Credits"));
const Compatibility = lazy(() => import("./pages/Compatibility"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Numerology = lazy(() => import("./pages/Numerology"));
const BirthChart = lazy(() => import("./pages/BirthChart"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Friends = lazy(() => import("./pages/Friends"));
const Messages = lazy(() => import("./pages/Messages"));
const Settings = lazy(() => import("./pages/Settings"));
const Match = lazy(() => import("./pages/Match"));
const Tarot = lazy(() => import("./pages/Tarot"));
const CoffeeFortune = lazy(() => import("./pages/CoffeeFortune"));
const DreamInterpretation = lazy(() => import("./pages/DreamInterpretation"));
const DailyHoroscope = lazy(() => import("./pages/DailyHoroscope"));
const Palmistry = lazy(() => import("./pages/Palmistry"));
const Handwriting = lazy(() => import("./pages/Handwriting"));
const SavedPosts = lazy(() => import("./pages/SavedPosts"));
const Reels = lazy(() => import("./pages/Reels"));
const Explore = lazy(() => import("./pages/Explore"));
const Groups = lazy(() => import("./pages/Groups"));
const GroupChat = lazy(() => import("./pages/GroupChat"));
const GroupSettings = lazy(() => import("./pages/GroupSettings"));
const Discovery = lazy(() => import("./pages/Discovery"));
const CallHistory = lazy(() => import("./pages/CallHistory"));
const VapidKeyGenerator = lazy(() => import("./pages/VapidKeyGenerator"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ErrorMonitor = lazy(() => import("./pages/ErrorMonitor"));
const ErrorAnalytics = lazy(() => import("./pages/ErrorAnalytics"));
const ErrorDetail = lazy(() => import("./pages/ErrorDetail"));
const Install = lazy(() => import("./pages/Install"));
const Feed = lazy(() => import("./pages/Feed"));

const queryClient = new QueryClient();

// Component that uses hooks - must be inside providers
const AppRoutes = () => {
  useUpdateOnlineStatus();
  useErrorAlerts(); // Real-time error alerting
  const location = useLocation();
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [incomingGroupCall, setIncomingGroupCall] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Track route changes for progress bar
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Listen for incoming calls
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("incoming-calls")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_logs",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const call = payload.new;
          
          // Only show dialog if status is ringing
          if (call.status === "ringing") {
            // Get caller info
            const { data: callerProfile } = await supabase
              .from("profiles")
              .select("username, full_name, profile_photo")
              .eq("user_id", call.caller_id)
              .single();

            if (callerProfile) {
              setIncomingCall({
                callId: call.call_id,
                callerId: call.caller_id,
                callerName: callerProfile.full_name || callerProfile.username,
                callerPhoto: callerProfile.profile_photo,
                callType: call.call_type,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Listen for incoming group calls
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("incoming-group-calls")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_call_participants",
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const participant = payload.new;
          
          // Only show dialog if status is invited
          if (participant.status === "invited") {
            // Get group call info
            const { data: groupCall } = await supabase
              .from("group_calls")
              .select("*, groups(*)")
              .eq("id", participant.call_id)
              .single();

            if (groupCall && groupCall.status === "ringing") {
              // Get caller info
              const { data: callerProfile } = await supabase
                .from("profiles")
                .select("username, full_name, profile_photo")
                .eq("user_id", groupCall.started_by)
                .single();

              if (callerProfile) {
                setIncomingGroupCall({
                  callId: groupCall.call_id,
                  groupCallId: groupCall.id,
                  groupId: groupCall.group_id,
                  groupName: groupCall.groups.name,
                  groupPhoto: groupCall.groups.photo_url,
                  callType: groupCall.call_type,
                  callerName: callerProfile.full_name || callerProfile.username,
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);
  
  const showNav = ['/', '/explore', '/reels', '/discovery', '/messages', '/profile', '/match', '/friends'].some(
    path => location.pathname === path || location.pathname.startsWith('/profile/')
  );

  const showFAB = location.pathname !== "/" && location.pathname !== "/auth";


  return (
    <>
      <RouteProgressBar isAnimating={isNavigating} />
      {incomingCall && (
        <IncomingCallDialog
          isOpen={true}
          onClose={() => setIncomingCall(null)}
          callId={incomingCall.callId}
          callerId={incomingCall.callerId}
          callerName={incomingCall.callerName}
          callerPhoto={incomingCall.callerPhoto}
          callType={incomingCall.callType}
        />
      )}
      {incomingGroupCall && (
        <IncomingGroupCallDialog
          isOpen={true}
          onClose={() => setIncomingGroupCall(null)}
          callId={incomingGroupCall.callId}
          groupCallId={incomingGroupCall.groupCallId}
          groupId={incomingGroupCall.groupId}
          groupName={incomingGroupCall.groupName}
          groupPhoto={incomingGroupCall.groupPhoto}
          callType={incomingGroupCall.callType}
          callerName={incomingGroupCall.callerName}
        />
      )}
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile/:username?" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/saved" element={<SavedPosts />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/tarot" element={<Tarot />} />
          <Route path="/coffee-fortune" element={<CoffeeFortune />} />
          <Route path="/palmistry" element={<Palmistry />} />
          <Route path="/handwriting" element={<Handwriting />} />
          <Route path="/birth-chart" element={<BirthChart />} />
          <Route path="/numerology" element={<Numerology />} />
          <Route path="/compatibility" element={<Compatibility />} />
          <Route path="/daily-horoscope" element={<DailyHoroscope />} />
          <Route path="/dream" element={<DreamInterpretation />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:groupId" element={<GroupChat />} />
          <Route path="/groups/:groupId/settings" element={<GroupSettings />} />
          <Route path="/match" element={<Match />} />
          <Route path="/call-history" element={<CallHistory />} />
          <Route path="/vapid-keys" element={<VapidKeyGenerator />} />
          <Route path="/error-monitor" element={<ErrorMonitor />} />
          <Route path="/error-analytics" element={<ErrorAnalytics />} />
          <Route path="/error/:errorId" element={<ErrorDetail />} />
          <Route path="/install" element={<Install />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {showNav && <MobileNav />}
      {showFAB && <FloatingActionButton />}
      <PWAInstallPrompt />
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <EnhancedOfflineIndicator />
              <Tutorial />
              <PushNotificationPrompt />
              <AppRoutes />
            </TooltipProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
