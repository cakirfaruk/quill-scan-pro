import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OfflineIndicator } from "@/components/OfflineIndicator";
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
import Feed from "./pages/Feed";
import SavedPosts from "./pages/SavedPosts";
import Reels from "./pages/Reels";
import Explore from "./pages/Explore";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/profile/:userId?" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/match" element={<Match />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
