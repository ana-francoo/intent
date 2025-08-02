export default function Flame() {
  return (
    <div className="relative left-1/2 -translate-x-1/2 scale-y-[0.6] scale-x-[0.7] bottom-[55%] [&_*:before]:absolute [&_*:before]:content-[''] [&_*:after]:absolute [&_*:after]:content-['']">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-[50px/40px] before:w-full before:h-0 before:rounded-full before:border-0 before:bg-[radial-gradient(#eaa121,#8e4901_45%,#b86409_80%)] after:w-[34px] after:h-0 after:left-1/2 after:-translate-x-1/2 after:rounded-full after:top-[14px] after:shadow-[0_0_20px_0_rgba(0,0,0,0.5)] after:bg-[radial-gradient(rgba(0,0,0,0.6),transparent_45%)]">
        {/* Glow */}
        <div className="absolute w-[100px] h-[180px] left-1/2 -top-[120px] -translate-x-1/2 rounded-full bg-[#ff6000] blur-[60px] opacity-0 animate-[var(--animate-glow-fade-delayed),var(--animate-blink)]"/>
        {/* Blue flame */}
        <div className="absolute w-[30px] h-[45px] rounded-[50%_50%_35%_35%] left-1/2 -top-[48px] -translate-x-1/2 bg-[rgba(0,133,255,0.7)] shadow-[0_-40px_30px_0_#dc8a0c,0_40px_50px_0_#dc8a0c,inset_3px_0_2px_0_rgba(0,133,255,0.6),inset_-3px_0_2px_0_rgba(0,133,255,0.6)] opacity-0 animate-[var(--animate-glow-fade)] before:w-[70%] before:h-[60%] before:left-1/2 before:-translate-x-1/2 before:bottom-0 before:rounded-full before:bg-black/35"/>
        {/* Orange flame */}
        <div className="absolute w-[30px] h-[90px] left-1/2 origin-[50%_100%] -translate-x-1/2 bottom-full rounded-[100%_100%_80%_80%] bg-[linear-gradient(white_80%,transparent)] opacity-0 animate-[var(--animate-spark-flame),var(--animate-move-flame),var(--animate-enlarge-flame)] before:w-full before:h-full before:rounded-[50%_50%_20%_20%] before:shadow-[0_0_15px_0_rgba(247,93,0,0.4),0_-6px_4px_0_rgba(247,128,0,0.7)]"/>
      </div>
    </div>
  );
}