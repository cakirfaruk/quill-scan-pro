import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Moon, Sun, Smartphone } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { cn } from "@/lib/utils";

const themes = {
  default: {
    name: "Varsayılan",
    primary: "291 100% 41%",
    accent: "240 4.8% 95.9%",
  },
  sunset: {
    name: "Gün Batımı",
    primary: "25 95% 53%",
    accent: "340 82% 52%",
  },
  ocean: {
    name: "Okyanus",
    primary: "199 89% 48%",
    accent: "170 78% 42%",
  },
  forest: {
    name: "Orman",
    primary: "142 76% 36%",
    accent: "84 81% 44%",
  },
  purple: {
    name: "Mor",
    primary: "271 81% 56%",
    accent: "300 76% 72%",
  },
  rose: {
    name: "Gül",
    primary: "346 77% 50%",
    accent: "350 89% 60%",
  }
};

export const ThemeCustomizer = () => {
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );
  const [oledMode, setOledMode] = useState(
    document.documentElement.classList.contains("oled")
  );

  const applyTheme = (themeKey: string) => {
    const theme = themes[themeKey as keyof typeof themes];
    if (theme) {
      document.documentElement.style.setProperty("--primary", theme.primary);
      document.documentElement.style.setProperty("--accent", theme.accent);
      setSelectedTheme(themeKey);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.remove("oled");
      setOledMode(false);
    }
  };

  const toggleOledMode = () => {
    const newOledMode = !oledMode;
    setOledMode(newOledMode);
    
    if (newOledMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.add("oled");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("oled");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Tema Modu</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={!darkMode ? "default" : "outline"}
                size="sm"
                onClick={toggleDarkMode}
                className="w-full"
              >
                <Sun className="w-4 h-4 mr-1" />
                Açık
              </Button>
              <Button
                variant={darkMode && !oledMode ? "default" : "outline"}
                size="sm"
                onClick={toggleDarkMode}
                className="w-full"
              >
                <Moon className="w-4 h-4 mr-1" />
                Koyu
              </Button>
              <Button
                variant={oledMode ? "default" : "outline"}
                size="sm"
                onClick={toggleOledMode}
                disabled={!darkMode && !oledMode}
                className="w-full"
              >
                <Smartphone className="w-4 h-4 mr-1" />
                OLED
              </Button>
            </div>
          </div>

          {/* Color Themes */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Renk Teması</Label>
            <RadioGroup value={selectedTheme} onValueChange={applyTheme}>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(themes).map(([key, theme]) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={cn(
                        "relative p-3 cursor-pointer transition-all border-2",
                        selectedTheme === key
                          ? "border-primary shadow-glow"
                          : "border-transparent hover:border-border"
                      )}
                      onClick={() => applyTheme(key)}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value={key} id={key} className="sr-only" />
                        <div className="flex gap-1.5 flex-1">
                          <div
                            className="w-6 h-6 rounded-full border-2 border-white/20"
                            style={{ backgroundColor: `hsl(${theme.primary})` }}
                          />
                          <div
                            className="w-6 h-6 rounded-full border-2 border-white/20"
                            style={{ backgroundColor: `hsl(${theme.accent})` }}
                          />
                        </div>
                      </div>
                      <Label
                        htmlFor={key}
                        className="text-xs font-medium mt-2 block cursor-pointer"
                      >
                        {theme.name}
                      </Label>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
