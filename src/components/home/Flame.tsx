import { cn } from "@/lib/utils";

export default function Flame({
  className,
  top,

}: {
  className?: string;
  top?: string | number;
}) {
  const topStyle = top ? { top: typeof top === 'number' ? `${top}px` : top } : {}
  return (
    <div 
    className={cn("relative *:left-1/2 *:-translate-x-1/2 *:bottom-0 *:before:absolute *:before:bottom-0 *:before:content-[''] *:before:left-1/2 *:before:-translate-x-1/2", className)}
    style={topStyle}
  >
      {/* Glow */}
      <div className="absolute size-25 -top-25 rounded-full bg-orange-600 blur-3xl fade-in animate-blink"/>
      {/* Blue flame */}
      <div className="absolute w-5 h-11.5 rounded-[100%_100%_50%_50%] bg-blue-500/70 shadow-[0_-40px_30px_0_#dc8a0c,0_40px_50px_0_#dc8a0c,inset_3px_0_2px_0_rgba(0,133,255,0.6),inset_-3px_0_2px_0_rgba(0,133,255,0.6)] before:w-[70%] before:h-[60%] before:rounded-full before:bg-black/35 fade-in"/>
      {/* Orange flame */}
      <div className="origin-bottom absolute w-5 h-20 rounded-[100%_100%_30%_30%] bg-[linear-gradient(white_80%,transparent)] animate-[var(--animate-move-flame),var(--animate-enlarge-flame)] before:w-full before:h-full before:rounded-[100%_100%_30%_30%] before:shadow-[0_0_15px_0_rgba(247,93,0,0.4),0_-6px_4px_0_rgba(247,128,0,0.7)]"/>
    </div>
  );
}