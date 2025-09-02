import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import IntentOnboarding from "./IntentOnboarding";
import { useNavigate } from "react-router-dom";

const App = () => {
  const navigate = useNavigate();
  
  return (
    <TooltipProvider>
      <Sonner />
      <IntentOnboarding onComplete={() => navigate('/dashboard')} />
    </TooltipProvider>
  );
};

export default App;
