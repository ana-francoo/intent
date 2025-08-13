import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo2.png';
import Flame from './Flame';
import { Button } from '../ui/button';

// check for session and redirect to main dashbaord if exists
// need to check payment status as well idk

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <div className="flex justify-center relative animate-slide-in-up">
        <div className="absolute left-1/2 -translate-x-1/2 bottom-15.5">
          <Flame top="-0.25vh" className="origin-bottom animate-flame-ignition scale-90 scale-y-60" />
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
            <button
              className="get-started-btn"
              type="button"
              onClick={() => navigate('/onboarding')}
            >
              <span className="btn-text">I'm Ready</span>
              <span className="btn-arrow">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                >
                  <path
                    d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </span>
            </button>
          </div>

        <div className="text-sm animate-slide-in-up delay-900">
          <span className="text-muted-foreground">Have an account? </span>
          <Button className='px-1' variant="link" onClick={() => navigate('/login')}>
            Log in
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
