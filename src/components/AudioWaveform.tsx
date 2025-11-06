import { useEffect, useRef, useState } from "react";

interface AudioWaveformProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
}

export const AudioWaveform = ({ audioUrl, currentTime, duration, isPlaying, onSeek }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Extract waveform data from audio
  useEffect(() => {
    const extractWaveform = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get the first channel data
        const channelData = audioBuffer.getChannelData(0);
        const samples = 100; // Number of bars in waveform
        const blockSize = Math.floor(channelData.length / samples);
        const waveform: number[] = [];
        
        // Calculate amplitude for each block
        for (let i = 0; i < samples; i++) {
          const start = blockSize * i;
          let sum = 0;
          
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j]);
          }
          
          waveform.push(sum / blockSize);
        }
        
        // Normalize to 0-1 range
        const max = Math.max(...waveform);
        const normalized = waveform.map(v => v / max);
        
        setWaveformData(normalized);
        setIsLoading(false);
        audioContext.close();
      } catch (error) {
        console.error('Error extracting waveform:', error);
        // Create fake waveform data as fallback
        const fakeData = Array.from({ length: 100 }, () => Math.random() * 0.7 + 0.3);
        setWaveformData(fakeData);
        setIsLoading(false);
      }
    };

    extractWaveform();
  }, [audioUrl]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const barWidth = rect.width / waveformData.length;
    const barGap = barWidth * 0.3;
    const actualBarWidth = barWidth - barGap;
    const progress = duration > 0 ? currentTime / duration : 0;

    waveformData.forEach((amplitude, index) => {
      const x = index * barWidth;
      const barHeight = amplitude * rect.height * 0.8;
      const y = (rect.height - barHeight) / 2;
      
      // Determine color based on progress
      const barProgress = index / waveformData.length;
      const isPlayed = barProgress <= progress;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
      
      if (isPlayed) {
        // Played portion - vibrant primary color
        gradient.addColorStop(0, 'hsl(var(--primary))');
        gradient.addColorStop(1, 'hsl(var(--primary) / 0.7)');
      } else {
        // Unplayed portion - muted
        gradient.addColorStop(0, 'hsl(var(--muted-foreground) / 0.3)');
        gradient.addColorStop(1, 'hsl(var(--muted-foreground) / 0.15)');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, actualBarWidth, barHeight);
      
      // Add glow effect for playing bar
      if (isPlaying && Math.abs(barProgress - progress) < 0.02) {
        ctx.shadowColor = 'hsl(var(--primary))';
        ctx.shadowBlur = 8;
        ctx.fillRect(x, y, actualBarWidth, barHeight);
        ctx.shadowBlur = 0;
      }
    });
  }, [waveformData, currentTime, duration, isPlaying]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const seekTime = progress * duration;
    
    onSeek(seekTime);
  };

  return (
    <div className="relative w-full h-12">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary/30 rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.random() * 20}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer rounded-sm"
        onClick={handleCanvasClick}
        style={{ opacity: isLoading ? 0 : 1 }}
      />
    </div>
  );
};
