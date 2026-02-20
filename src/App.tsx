import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import { MainLayout } from "@/components/layout/MainLayout";

import { useUpdateOnlineStatus } from "@/hooks/use-online-status";
import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingFallback } from "@/components/LoadingFallback";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

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

// Lazy-load non-critical UI components (not needed on initial render)
const IncomingCallDialog = lazy(() => import("@/components/IncomingCallDialog").then(m => ({ default: m.IncomingCallDialog })));
const IncomingGroupCallDialog = lazy(() => import("@/components/IncomingGroupCallDialog").then(m => ({ default: m.IncomingGroupCallDialog })));
const PWAInstallPrompt = lazy(() => import("@/components/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));
const PushNotificationPrompt = lazy(() => import("@/components/PushNotificationPrompt").then(m => ({ default: m.PushNotificationPrompt })));
const EnhancedOfflineIndicator = lazy(() => import("@/components/EnhancedOfflineIndicator").then(m => ({ default: m.EnhancedOfflineIndicator })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 min — don't refetch if fresh
      gcTime: 10 * 60 * 1000,        // 10 min garbage collection
      refetchOnWindowFocus: false,    // Don't refetch on tab switch
      retry: 1,                        // 1 retry is enough
    },
  },
});

// Component that uses hooks - must be inside providers
const AppRoutes = () => {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  useUpdateOnlineStatus(currentUserId);
  const location = useLocation();
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [incomingGroupCall, setIncomingGroupCall] = useState<any>(null);

  // Defer call subscriptions — 10s after mount to not block initial render
  useEffect(() => {
    if (!currentUserId) return;

    const timerId = setTimeout(() => {
      const callChannel = supabase
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
            if (call.status === "ringing") {
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

      const groupCallChannel = supabase
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
            if (participant.status === "invited") {
              const { data: groupCall } = await supabase
                .from("group_calls")
                .select("*, groups(*)")
                .eq("id", participant.call_id)
                .single();

              if (groupCall && groupCall.status === "ringing") {
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

      // Store for cleanup
      (window as any).__callChannels = [callChannel, groupCallChannel];
    }, 10000);

    return () => {
      clearTimeout(timerId);
      const channels = (window as any).__callChannels;
      if (channels) {
        channels.forEach((ch: any) => supabase.removeChannel(ch));
        delete (window as any).__callChannels;
      }
    };
  }, [currentUserId]);





  return (
    <>
      {incomingCall && (
        <Suspense fallback={null}>
          <IncomingCallDialog
            isOpen={true}
            onClose={() => setIncomingCall(null)}
            callId={incomingCall.callId}
            callerId={incomingCall.callerId}
            callerName={incomingCall.callerName}
            callerPhoto={incomingCall.callerPhoto}
            callType={incomingCall.callType}
          />
        </Suspense>
      )}
      {incomingGroupCall && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}
      <ChunkErrorBoundary chunkName="uygulama">
        <Suspense fallback={<LoadingFallback />}>
          <Routes location={location}>
            <Route path="/auth" element={<Auth />} />
            <Route path="/install" element={<Install />} />

            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
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
              <Route path="/feed" element={<Feed />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ChunkErrorBoundary>
      <Suspense fallback={null}>
        <PWAInstallPrompt />
      </Suspense>
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={null}>
                <EnhancedOfflineIndicator />
              </Suspense>
              <Suspense fallback={null}>
                <PushNotificationPrompt />
              </Suspense>
              <AppRoutes />
            </TooltipProvider>
          </ThemeProvider>
        </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
