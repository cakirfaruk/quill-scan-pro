import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
          <Route path="/handwriting" element={<Handwriting />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/compatibility" element={<Compatibility />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/numerology" element={<Numerology />} />
          <Route path="/birth-chart" element={<BirthChart />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/match" element={<Match />} />
          <Route path="/tarot" element={<Tarot />} />
          <Route path="/coffee-fortune" element={<CoffeeFortune />} />
          <Route path="/dream" element={<DreamInterpretation />} />
          <Route path="/daily-horoscope" element={<DailyHoroscope />} />
          <Route path="/palmistry" element={<Palmistry />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/feed" element={<Feed />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
