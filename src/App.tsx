import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { RouteProgressBar } from "@/components/AnimationWrappers";
import { EnhancedOfflineIndicator } from "@/components/EnhancedOfflineIndicator";
import { MobileNav } from "@/components/MobileNav";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { useUpdateOnlineStatus } from "@/hooks/use-online-status";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IncomingCallDialog } from "@/components/IncomingCallDialog";
import { IncomingGroupCallDialog } from "@/components/IncomingGroupCallDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useErrorAlerts } from "@/hooks/use-error-alerts";

// NORMAL IMPORTS - NO LAZY LOADING FOR MOBILE COMPATIBILITY
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Credits from "./pages/Credits";
import Compatibility from "./pages/Compatibility";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Numerology from "./pages/Numerology";
import BirthChart from "./pages/BirthChart";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import Match from "./pages/Match";
import Tarot from "./pages/Tarot";
import CoffeeFortune from "./pages/CoffeeFortune";
import DreamInterpretation from "./pages/DreamInterpretation";
import DailyHoroscope from "./pages/DailyHoroscope";
import Palmistry from "./pages/Palmistry";
import Handwriting from "./pages/Handwriting";
import SavedPosts from "./pages/SavedPosts";
import Reels from "./pages/Reels";
import Explore from "./pages/Explore";
import Groups from "./pages/Groups";
import GroupChat from "./pages/GroupChat";
import GroupSettings from "./pages/GroupSettings";
import Discovery from "./pages/Discovery";
import CallHistory from "./pages/CallHistory";
import VapidKeyGenerator from "./pages/VapidKeyGenerator";
import NotFound from "./pages/NotFound";
import ErrorMonitor from "./pages/ErrorMonitor";
import ErrorAnalytics from "./pages/ErrorAnalytics";
import ErrorDetail from "./pages/ErrorDetail";
import Install from "./pages/Install";
import Feed from "./pages/Feed";

const queryClient = new QueryClient();

// Component that uses hooks - must be inside providers
const AppRoutes = () => {
  const location = useLocation();
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [incomingGroupCall, setIncomingGroupCall] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

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
      {showNav && <MobileNav />}
      {showFAB && <FloatingActionButton />}
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
              <AppRoutes />
            </TooltipProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
