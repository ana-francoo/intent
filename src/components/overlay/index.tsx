import { useSearchParams } from "react-router-dom";
import { PenLine } from "lucide-react";
import { Textarea } from "../ui/textarea";

export default function IntentionOverlay() {
  const [searchParams] = useSearchParams();
  const targetUrl = searchParams.get('targetUrl');
  
  return (
    <div className="min-h-screen w-full relative bg-background">
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99, 102, 241, 0.25), transparent 70%), #000000",
        }}
      />
      
      <div className="relative max-w-xl mx-auto flex flex-col items-center justify-center min-h-screen">
        <div className="space-y-8 w-full">
          <div className="flex justify-center">
            <div className="size-16 bg-muted rounded-full"/>
          </div>
          
          <div className='relative'>
            <div className='absolute top-0 flex w-full justify-center'>
              <div className='h-[1px] animate-border-width rounded-full bg-gradient-to-r from-border via-primary to-border transition-all duration-1000' />
            </div>
            
            <div className="relative">
              <PenLine className="absolute left-4 top-4.5 size-4 text-muted-foreground z-10" />
              <Textarea 
                id="intention-textarea" 
                className="p-4 text-lg focus-visible:ring-0 border-border focus-visible:border-border resize-none focus:outline-none rounded-xl shadow-lg pl-10" 
                placeholder="What is your intention for this website?" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}