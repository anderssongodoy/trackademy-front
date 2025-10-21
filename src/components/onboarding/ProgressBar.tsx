interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className = "" }: ProgressBarProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-all duration-300 ${
            i + 1 <= current
              ? "bg-gradient-primary"
              : "bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}
