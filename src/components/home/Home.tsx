import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo2.png';
import Flame from './Flame';
import { ArrowRightIcon } from 'lucide-react';
import { Button } from '../ui/button';

// check for session and redirect to main dashbaord if exists
// need to check payment status as well idk

export default function Home() {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    navigate('/welcome');
  };

  const handleToAuth = () => {
    navigate('/auth');
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <div className="flex justify-center relative animate-slide-in-up">
        <div className="absolute left-1/2 -translate-x-1/2 bottom-15.5">
          <Flame className="origin-bottom animate-flame-ignition scale-90 scale-y-60" />
        </div>
        <img src={logo} alt="Logo" className="size-36 transition-all duration-500 rounded-full bg-radial from-orange-400/15 from-60% to-transparent shadow-[0_0_40px_10px_rgb(251_146_60),0_0_0_4px_rgb(251_146_60/0.08)] opacity-100" />
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold animate-slide-in-up delay-300">
            Ready to reclaim your focus?
          </h1>
          <p className="text-muted-foreground text-sm animate-slide-in-up delay-500">
            Follow-through with your intention, distraction-free.
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="animate-slide-in-up delay-700">
            <Button variant="secondary" onClick={handleGetStarted} className="group rounded-lg bg-orange-600 hover:bg-orange-600/90">
              I'm Ready
              <ArrowRightIcon
                className="-me-1 ml-1 stroke-3 opacity-60 transition-transform group-hover:translate-x-0.5"
                size={16}
                aria-hidden="true"
              />
            </Button>
          </div>

        <div className="text-sm animate-slide-in-up delay-900">
          <span className="text-muted-foreground">Have an account? </span>
          <Button className='px-1' variant="link" onClick={handleToAuth}>
            Log in
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
