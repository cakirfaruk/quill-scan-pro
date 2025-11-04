import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Tutorial } from "@/components/Tutorial";
import { MobileNav } from "@/components/MobileNav";
import { useUpdateOnlineStatus } from "@/hooks/use-online-status";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";

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
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const OnlineStatusWrapper = () => {
  useUpdateOnlineStatus();
  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <OnlineStatusWrapper />
          <Toaster />
          <Sonner />
          <OfflineIndicator />
          <Tutorial />
          <BrowserRouter>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <Routes>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <MobileNavWrapper />
        </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Only show MobileNav on specific pages
const MobileNavWrapper = () => {
  const location = window.location.pathname;
  const showNav = ['/', '/explore', '/reels', '/discovery', '/messages', '/profile', '/match', '/friends'].some(
    path => location === path || location.startsWith('/profile/')
  );
  
  return showNav ? <MobileNav /> : null;
};

export default App;
