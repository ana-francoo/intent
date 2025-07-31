import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "@/components/index-page/Index";

const App = () => (
  <TooltipProvider>
    <Sonner />
    <Index />
  </TooltipProvider>
);

export default App;
