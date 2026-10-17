// components/WaveformVisualizer.tsx — Animated waveform for live recording state

interface Props {
  active: boolean;
  bars?: number;
  color?: string;
}

export function WaveformVisualizer({ active, bars = 24, color = "#6258E8" }: Props) {
  return (
    <div className="flex items-center gap-[3px] h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full transition-all"
          style={{
            backgroundColor: color,
            height: active ? "100%" : "20%",
            opacity: active ? 1 : 0.3,
            animationName: active ? "waveform" : "none",
            animationDuration: `${0.8 + (i % 5) * 0.15}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${(i * 0.05) % 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}
