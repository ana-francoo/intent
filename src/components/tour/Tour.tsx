import { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './Tour.css';
import TourText from './TourText';
import { createFloatingPopup } from '@/utils/floatingPopup';
import { supabase } from '../../supabaseClient';
import { Input } from '../ui/input';

import logo from '@/assets/logo2.png';
import Flame from '@/components/home/Flame';
import PinOpen from '@/assets/pin-open.png';

function EmbeddedSignupCard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [, setIsLoading] = useState(false);

  const getRedirectUrl = () => {
    const isDev = import.meta.env.DEV;
    return isDev ? 'http://localhost:5173/auth-callback' : 'https://useintent.app/auth-callback';
  };

  useEffect(() => {
    const isTour = typeof window !== 'undefined' && window.location.hash.includes('tour');
    const { data: listener } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (isTour) return; // Do not show signed-in banner during tour
      if (session) {
        setInfo('Signed in successfully.');
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsLoading(true);
    try {
      const redirectUrl = getRedirectUrl();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (signUpError) throw signUpError;
      setInfo('Check your email for the confirmation link.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [email, password]);

  

  return (
    <div className="tour-embedded-signup w-full max-w-md z-[2147483647]">
      <div className="relative rounded-xl p-5 border border-white/10 bg-white/5 shadow-lg backdrop-blur-sm">
        <div className='absolute top-0 left-0 right-0 flex justify-center pointer-events-none'>
          <div className='h-[1px] animate-border-width rounded-full bg-gradient-to-r from-transparent via-orange-700 to-transparent transition-all duration-1000' />
        </div>
        
        {error && (
          <div className="w-full rounded-md border border-red-500/30 bg-red-500/10 p-2 text-center text-xs text-red-400 mb-2">{error}</div>
        )}
        {info && (
          <div className="w-full rounded-md border border-green-500/25 bg-green-500/50 p-2 text-center text-xs text-green-500 mb-2">{info}</div>
        )}
        <form onSubmit={handleSignup} className="space-y-2" id="tour-embedded-signup-form">
          <div className="grid gap-1.5">
            <label htmlFor="tour-email" className="text-sm text-white/85">Email</label>
            <Input id="tour-email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="tour-password" className="text-sm text-white/85">Password</label>
            <Input id="tour-password" type="password" placeholder="Create a password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="tour-confirm" className="text-sm text-white/85">Confirm password</label>
            <Input id="tour-confirm" type="password" placeholder="Re-enter your password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          {/* Submit button removed; submission will be triggered by the external CTA */}
        </form>
        
      </div>
    </div>
  );
}

const Tour = () => {
  const [extensionClicked, setExtensionClicked] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const getInitialFirstText = () => {
    // Fixed pixels (no viewport-relative positioning)
    return { top: 440, right: 110, fontSize: 26};
  };
  const [firstTextPosition] = useState(getInitialFirstText);

  // No dynamic repositioning; positions handled via CSS classes

  useEffect(() => {
    // Set tab title while on the Tour page
    const previousTitle = document.title;
    document.title = 'Intent';

    // No dynamic position calculations; CSS handles layout
    
    // Start polling for toolbar pin state once per second
    let pollTimer: number | null = null;
    const pollPinState = async () => {
      try {
        // Guard if chrome.action is unavailable in the environment
        if (typeof chrome === 'undefined' || !chrome.action || !chrome.action.getUserSettings) return;
        const settings = await chrome.action.getUserSettings();
        if (settings?.isOnToolbar) {
          setIsPinned(true);
          if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
        }
      } catch {
        // ignore
      }
    };
    // immediate check, then every 500ms until true
    pollPinState();
    pollTimer = window.setInterval(pollPinState, 500);

    // Intentionally no resize/orientation listeners: positions are frozen
    
    // Check if we're opened as a popup on Tour step 2
    const checkIfPopupOnTour = () => {
      const isPopupWindow = window.outerWidth <= 500 && window.outerHeight <= 700;
      const isOnTour = window.location.hash.includes('#/tour');
      
      if (isPopupWindow && isOnTour && !extensionClicked) {
        console.log('🎯 Detected popup opened on Tour step 2, redirecting to tab and creating floating popup');
        
        // Send message to open Tour in tab and create floating popup
        chrome.runtime.sendMessage({ 
          type: 'OPEN_TOUR_WITH_FLOATING_POPUP' 
        }, () => {
          window.close();
        });
      }
    };
    
    // Check immediately
    checkIfPopupOnTour();
    
    // Listen for when the extension creates a visual element (for non-popup scenarios)
    const handlePopupOpened = (message: any) => {
      if (message.type === 'CREATE_VISUAL_ELEMENT' && message.elementType === 'floating-popup') {
        console.log('🎯 Extension clicked, creating floating popup');
        setExtensionClicked(true);
        
        // Create the floating popup iframe with the tour-specific dashboard
        const popupResult = createFloatingPopup({ route: '/tour-dashboard' });
        const element = popupResult.element;
        
        // Center the floating dashboard and create an anchor for relative elements
        (element as HTMLElement).classList.add('tour-dashboard');
        
        // Disable the popup close (X) button while in the Tour page
        const closeButton = element.querySelector('button');
        if (closeButton) {
          try {
            // Visually and functionally disable the button
            (closeButton as HTMLButtonElement).disabled = true;
            (closeButton as HTMLButtonElement).ariaDisabled = 'true';
            closeButton.style.opacity = '0.45';
            closeButton.style.cursor = 'not-allowed';
            closeButton.style.pointerEvents = 'none';
            closeButton.title = 'Disabled during tour';
            // Prevent any existing handlers from firing
            closeButton.onclick = (ev: any) => {
              if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
              if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
              return false;
            };
          } catch {
            // ignore
          }
        }
        
        // Track tour step across handlers (0 initial, 1 after arrow-block, 2 after settings prompt, 3 after settings opened)
        let tourStep = 0;

        // Listen for settings-opened messages from the iframe to hide prompts immediately
        const onMessage = (evt: MessageEvent) => {
          if (evt?.data?.type === 'OPEN_ACCOUNT_SETTINGS') {
            const press = document.querySelector('.press-settings') as HTMLElement | null;
            if (press) press.style.display = 'none';
            const settingsText = document.querySelector('.text-settings') as HTMLElement | null;
            if (settingsText) settingsText.style.display = 'none';
            const btn = document.querySelector('.tour-continue-button') as HTMLElement | null;
            if (btn) btn.classList.remove('dimmed');
            const accSvg = document.querySelector('.accountability-svg') as HTMLElement | null;
            if (accSvg) accSvg.style.display = 'block';
            const accText = document.querySelector('.text-accountability') as HTMLElement | null;
            if (accText) accText.style.display = 'block';
            // Advance to step 3 so next Continue hides accountability and shows subscription
            tourStep = 3;
          }
        };
        window.addEventListener('message', onMessage);
        ;(window as any)._tourOnMessage = onMessage;

        // Ensure Tour-specific CSS animations exist (kept for subtle appear effects)
        if (!document.getElementById('tour-animations')) {
          const style = document.createElement('style');
          style.id = 'tour-animations';
          style.textContent = `
            @keyframes additional-svg-appear { 0% { opacity: 0; transform: scale(0.96); } 100% { opacity: 1; transform: scale(1); } }
            @keyframes tour-text-appear { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
          `;
          document.head.appendChild(style);
        }
        
        // Create anchor, second svg, text, and continue button using CSS classes
        setTimeout(() => {
          // Guard against duplicate creation if handler fires more than once
          if (document.getElementById('tour-dashboard-anchor')) return;

          const anchor = document.createElement('div');
          anchor.id = 'tour-dashboard-anchor';
          anchor.className = 'tour-dashboard-anchor';
          document.body.appendChild(anchor);

          const secondSvg = document.createElement('div');
          secondSvg.className = 'tour-second-svg';
          secondSvg.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" fill="none" style="width: 100%; height: 100%;">
              <path d="M168.97138,43.22749c12.64149,0,12.90694,18.62863,12.90694,28.16059c0,14.17547-8.24082,31.42365-2.73783,43.80536.26999.60748.72094,1.37841.39112,1.9556-1.41257,2.47199-4.67465,2.15888-5.08455,6.25791-1.13699,11.36992,5.7975,26.79941,6.64903,38.72081.56991,7.97879.51404,29.72506-11.34246,29.72506" transform="translate(-18.97138 21.120441)" fill="none" stroke="#ff6b35" stroke-width="2"/>
            </svg>
          `;
          anchor.appendChild(secondSvg);
          
          const secondText = document.createElement('div');
          secondText.className = 'tour-firststep';
          secondText.textContent = '3. By default, all sites are blocked. You can unblock or customize sites anytime to match your focus zones';
          secondSvg.appendChild(secondText);

          // Prepare the arrow-block (initially hidden)
          const arrowBlock = document.createElement('div');
          arrowBlock.className = 'arrow-block';
          arrowBlock.style.display = 'none';
          arrowBlock.innerHTML = `
            <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" class="arrow-svg">
              <g transform="matrix(2.866928 0 0 2.7726-42.151342-361.726266)">
                <path d="M184.45817,163.48724c16.49325-2.06166,29.20963-21.42272,35.04981-35.04981" transform="matrix(2.093763 0 0 1.610628-344.452366-72.639951)" fill="none" stroke="#ff6b35"/>
                <path d="M219.05803,128.57757c.36866,1.84328,1.0723,3.5632,1.43866,5.39497" transform="matrix(1.728749 0 0 1.14198-264.022798-13.373526)" fill="none" stroke="#ff6b35"/>
                <path d="M219.05803,128.57757c.36866,1.84328,1.0723,3.5632,1.43866,5.39497" transform="matrix(-1.586704-1.373376-.74282 0.858203 558.235564 324.389133)" fill="none" stroke="#ff6b35"/>
              </g>
            </svg>
          `;
          const textBlock = document.createElement('div');
          textBlock.className = 'text-block';
          textBlock.textContent = "4. Want to stay focused on your current site? Just hit 'Block' to add it instantly";
          arrowBlock.appendChild(textBlock);
          anchor.appendChild(arrowBlock);

          // Prepare subscription step elements (initially hidden)
          const subscriptionSvg = document.createElement('div');
          subscriptionSvg.className = 'subscription-svg';
          subscriptionSvg.style.display = 'none';
          subscriptionSvg.innerHTML = `
            <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" class="arrow-svg">
              <g transform="matrix(2.866928 0 0 2.7726-42.151342-361.726266)">
                <path d="M184.45817,163.48724c16.49325-2.06166,29.20963-21.42272,35.04981-35.04981" transform="matrix(2.093763 0 0 1.610628-344.452366-72.639951)" fill="none" stroke="#ff6b35"/>
                <path d="M219.05803,128.57757c.36866,1.84328,1.0723,3.5632,1.43866,5.39497" transform="matrix(1.728749 0 0 1.14198-264.022798-13.373526)" fill="none" stroke="#ff6b35"/>
                <path d="M219.05803,128.57757c.36866,1.84328,1.0723,3.5632,1.43866,5.39497" transform="matrix(-1.586704-1.373376-.74282 0.858203 558.235564 324.389133)" fill="none" stroke="#ff6b35"/>
              </g>
            </svg>
          `;
          const subscriptionText = document.createElement('div');
          subscriptionText.className = 'text-subscription';
          subscriptionText.textContent = '7. Manage your subscription anytime from this screen! Your first 2 weeks of Pro are free';
          subscriptionText.style.display = 'none';
          subscriptionSvg.appendChild(subscriptionText);
          anchor.appendChild(subscriptionSvg);

          // Prepare accountability step elements (initially hidden)
          const accountabilitySvg = document.createElement('div');
          accountabilitySvg.className = 'accountability-svg';
          accountabilitySvg.style.display = 'none';
          accountabilitySvg.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" fill="none" style="width: 100%; height: 100%;">
              <path d="M168.97138,43.22749c12.64149,0,12.90694,18.62863,12.90694,28.16059c0,14.17547-8.24082,31.42365-2.73783,43.80536.26999.60748.72094,1.37841.39112,1.9556-1.41257,2.47199-4.67465,2.15888-5.08455,6.25791-1.13699,11.36992,5.7975,26.79941,6.64903,38.72081.56991,7.97879.51404,29.72506-11.34246,29.72506" transform="translate(-18.97138 21.120441)" stroke="#ff6b35" stroke-width="2"/>
            </svg>
          `;
          anchor.appendChild(accountabilitySvg);

          const accountabilityText = document.createElement('div');
          accountabilityText.className = 'text-accountability';
          accountabilityText.textContent = '6. An accountability partner can be added to stay on track together';
          accountabilityText.style.display = 'none';
          anchor.appendChild(accountabilityText);

          // Prepare a new press animation and helper text (initially hidden)
          const pressSettings = document.createElement('div');
          pressSettings.className = 'press-settings';
          pressSettings.style.display = 'none';
          anchor.appendChild(pressSettings);

          const syncAnchorToPopup = () => {
            try {
              const rect = (element as HTMLElement).getBoundingClientRect();
              anchor.style.position = 'fixed';
              anchor.style.left = `${Math.round(rect.left)}px`;
              anchor.style.top = `${Math.round(rect.top)}px`;
              anchor.style.width = `${Math.round(rect.width)}px`;
              anchor.style.height = `${Math.round(rect.height)}px`;
              anchor.style.transform = 'none';
            } catch {}
          };
          const updatePressFromIframe = () => {
            try {
              const iframe = document.querySelector('#floating-popup-container iframe') as HTMLIFrameElement | null;
              if (!iframe || !iframe.contentDocument) return;
              const btn = iframe.contentDocument.getElementById('tour-settings-button') as HTMLElement | null;
              if (!btn) return;
              const btnRect = btn.getBoundingClientRect();
              const iframeRect = iframe.getBoundingClientRect();
              const anchorRect = anchor.getBoundingClientRect();
              const cx = iframeRect.left + btnRect.left + btnRect.width / 2;
              const cy = iframeRect.top + btnRect.top + btnRect.height / 2;
              const leftPct = ((cx - anchorRect.left) / Math.max(anchorRect.width, 1)) * 100;
              const topPct = ((cy - anchorRect.top) / Math.max(anchorRect.height, 1)) * 100;
              anchor.style.setProperty('--press-left', `${leftPct}%`);
              anchor.style.setProperty('--press-top', `${topPct}%`);
            } catch {}
          };
          syncAnchorToPopup();
          updatePressFromIframe();
          try {
            const ro = new ResizeObserver(() => { syncAnchorToPopup(); updatePressFromIframe(); });
            ro.observe(element as HTMLElement);
            (window as any)._tourAnchorRO = ro;
          } catch {}
          const onResize = () => { syncAnchorToPopup(); updatePressFromIframe(); };
          window.addEventListener('resize', onResize);
          (window as any)._tourSyncAnchor = onResize;

          const settingsText = document.createElement('div');
          settingsText.className = 'text-settings';
          settingsText.textContent = '5. Click on Settings to customize your experience';
          settingsText.style.display = 'none';
          anchor.appendChild(settingsText);
          
          const continueBtn = document.createElement('button');
          continueBtn.className = 'tour-continue-button';
          continueBtn.textContent = 'Continue';
          continueBtn.onmouseenter = () => {
            continueBtn.classList.add('hover');
          };
          continueBtn.onmouseleave = () => {
            continueBtn.classList.remove('hover');
          };
          continueBtn.onclick = () => {
            if (tourStep === 0) {
              // Hide all matching elements on first click (avoid duplicates lingering)
              const hideSelectors = ['.tour-second-svg', '.tour-firststep'];
              hideSelectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                  (el as HTMLElement).style.display = 'none';
                });
              });
              // Show the arrow block and helper text
              arrowBlock.style.display = 'block';
              tourStep = 1;
              return;
            }
            if (tourStep === 1) {
              // Hide arrow-block/text and show settings press + text
              arrowBlock.style.display = 'none';
              pressSettings.style.display = 'block';
              settingsText.style.display = 'block';
              continueBtn.classList.add('dimmed');
              tourStep = 2;
              // Notify the TourDashboard that step 2 is reached and settings can be enabled
              const iframe = document.querySelector('#floating-popup-container iframe') as HTMLIFrameElement;
              if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'TOUR_STEP_2_REACHED' }, '*');
              }
              updatePressFromIframe();
              return;
            }
            if (tourStep === 3) {
              // Hide accountability visuals and show subscription arrow/text
              const accSvg = document.querySelector('.accountability-svg') as HTMLElement | null;
              if (accSvg) accSvg.style.display = 'none';
              const accText = document.querySelector('.text-accountability') as HTMLElement | null;
              if (accText) accText.style.display = 'none';
              subscriptionSvg.style.display = 'block';
              subscriptionText.style.display = 'block';
              // Update button label for final step
              continueBtn.textContent = 'Done!';
              tourStep = 4;
              return;
            }
            if (tourStep === 4) {
              // Fire confetti and finish
              const container = document.createElement('div');
              container.className = 'confetti-container confetti-center';
              document.body.appendChild(container);

              // Ensure the Create Account CTA exists now so we can target it
              let cta = document.getElementById('tour-create-account-cta');
              if (!cta) {
                cta = document.createElement('div');
                cta.id = 'tour-create-account-cta';
                cta.className = 'tour-create-account-cta';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'get-started-btn';
                btn.innerHTML = `
                  <span class="btn-text">Create Account</span>
                  <span class="btn-arrow">
                    <svg width="24" height="24" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6">
                      <path
                        d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                    </svg>
                  </span>
                `;
                btn.onclick = () => {
                  // Trigger the embedded signup form submission instead of opening popup
                  const form = document.getElementById('tour-embedded-signup-form') as HTMLFormElement | null;
                  if (form) {
                    form.requestSubmit();
                  }
                };
                cta.appendChild(btn);
                document.body.appendChild(cta);
              }

              // Compute CTA button center relative to viewport center (confetti origin)
              const btnEl = (cta!.querySelector('button') as HTMLElement) || (cta as HTMLElement);
              const rect = btnEl.getBoundingClientRect();
              const ctaCenterX = rect.left + rect.width / 2;
              // Use true vertical center and add a slight upward correction to match perceived center
              const ctaCenterY = rect.top + rect.height / 2;
              const viewportCenterX = window.innerWidth / 2;
              const viewportCenterY = window.innerHeight / 2;
              const verticalAdjustPx = -55; // nudge upward to visually center on the button
              const txReturn = `${ctaCenterX - viewportCenterX}px`;
              const tyReturn = `${ctaCenterY - viewportCenterY + verticalAdjustPx}px`;

              const colors = ['#FF944D', '#FF6B35', '#F5E6D3', '#8FBC8F', '#D4C4A8'];
              const count = 140;
              for (let i = 0; i < count; i++) {
                const piece = document.createElement('div');
                piece.className = 'confetti';
                // Random trajectory (explosive radial burst)
                const angle = Math.random() * Math.PI * 2;
                const speed = 160 + Math.random() * 260; // px
                const dx = Math.cos(angle) * speed;
                const dy = Math.sin(angle) * speed;
                const rot = (Math.random() * 720 + 360) + 'deg';
                piece.style.setProperty('--dx', dx + 'px');
                piece.style.setProperty('--dy', dy + 'px');
                piece.style.setProperty('--rot', rot);
                const dur = 1;
                const delay = Math.random() * 0.15;
                piece.style.setProperty('--dur', `${dur}s`);
                piece.style.setProperty('--delay', `${delay}s`);
                // Return target toward CTA center
                piece.style.setProperty('--tx-return', txReturn);
                piece.style.setProperty('--ty-return', tyReturn);
                // Chain outward burst then return toward CTA
                // Faster return with a brief gap and snappier easing
                const returnDur = Math.random() * 0.25; // 0.45s - 0.70s
                const returnDelay = delay + dur + 0.05; // shorter gap before return
                piece.style.animation = `confetti-burst ${dur}s cubic-bezier(.16,.9,.17,1) ${delay}s forwards, confetti-return ${returnDur}s cubic-bezier(.35,1,.35,1) ${returnDelay}s forwards`;
                piece.style.background = colors[i % colors.length];
                piece.onclick = () => {
                  piece.style.opacity = '0';
                  piece.style.transform = 'scale(1.6)';
                  setTimeout(() => piece.remove(), 200);
                };
                // Track end time of this piece to trigger border flash later
                const totalMs = (delay + dur + 0.05 + returnDur) * 1000;
                (piece as any)._endAt = performance.now() + totalMs;
                container.appendChild(piece);
              }

              // Switch background to dark when return starts
              const bg = document.querySelector('.tour-background');
              setTimeout(() => {
                bg?.classList.add('tour-dark');
                // Remove popup (if any); embedded signup will render after first border revolution
                const popupContainer = document.getElementById('floating-popup-container') as HTMLElement | null;
                if (popupContainer) popupContainer.remove();
              }, 1350); // add 300ms delay to the light→dark transition

              // After all pieces return, flash the CTA border once (counterclockwise) and restore bg
              const btnElFlash = (cta!.querySelector('button') as HTMLElement) || (cta as HTMLElement);
              const endTimes = Array.from(container.children).map(ch => (ch as any)._endAt || 0);
              const maxEnd = Math.max(...endTimes, 0);
              const waitMs = Math.max(0, maxEnd - performance.now());
              setTimeout(() => {
                // Add class for a two-rev CCW border animation
                btnElFlash.classList.add('intent-border-flash');
                // Timings must align with CSS animations:
                const firstRevMs = 1200; // var(--border-dur, 1.2s)
                const secondRevMs = 2400; // var(--border-dur-slow, 2.4s)
                // Trigger movements and embedded signup ~30% into first revolution
                const triggerMs = Math.floor(firstRevMs * 0.3);
                setTimeout(() => {
                  // Move logo+flame wrapper upward
                  const logoWrapper = document.querySelector('.logo-flame-root') as HTMLElement | null;
                  if (logoWrapper) {
                    // Use CSS-defined --logo-top-final fallback; just trigger the motion
                    logoWrapper.classList.add('logo-flame-move-up');
                  }
                  // Move CTA downward to a fixed top position
                  const ctaWrapper = document.getElementById('tour-create-account-cta') as HTMLElement | null;
                  if (ctaWrapper) {
                    // Compute current center-top as animation start and animate to final top
                    const rect = ctaWrapper.getBoundingClientRect();
                    const currentTop = rect.top;
                    ctaWrapper.style.setProperty('--cta-top-start', `${Math.round(currentTop)}px`);
                    ctaWrapper.classList.add('tour-cta-move-down');
                  }
                  if (!document.getElementById('tour-embedded-signup-root')) {
                    const signupRoot = document.createElement('div');
                    signupRoot.id = 'tour-embedded-signup-root';
                    document.body.appendChild(signupRoot);
                    const root = createRoot(signupRoot);
                    root.render(<EmbeddedSignupCard />);
                  }
                }, triggerMs);
                // Remove border flash class only after second revolution completes
                setTimeout(() => {
                  btnElFlash.classList.remove('intent-border-flash');
                  // Keep dark background after the effect completes
                }, firstRevMs + secondRevMs + 80);
              }, waitMs + 50);
              // Fade out remaining tour elements (except confetti), and show centered logo+flame
              const toFade = [
                '.tour-dashboard',
                '#floating-popup-container',
                '.tour-dashboard-anchor',
                '.tour-arrow',
                '.tour-guide-image',
                '.tour-first-text',
                '.tour-continue-button',
                '.tour-second-svg',
                '.tour-firststep',
                '.arrow-block',
                '.text-block',
                '.accountability-svg',
                '.text-accountability',
                '.subscription-svg',
                '.text-subscription'
              ];
              toFade.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                  (el as HTMLElement).classList.add('tour-fade-out');
                  (el as HTMLElement).style.pointerEvents = 'none';
                });
              });
              // Explicitly override inline animation on the popup container so the fade applies
              const popupEl = document.getElementById('floating-popup-container');
              if (popupEl) {
                (popupEl as HTMLElement).style.animation = 'tour-fade-out 0.4s ease-out forwards';
              }
              continueBtn.classList.add('tour-fade-out');

              // Render Flame + Logo combo (mirrors Home component)
              const logoRootEl = document.createElement('div');
              logoRootEl.className = 'logo-flame-root';
              document.body.appendChild(logoRootEl);
              const root = createRoot(logoRootEl);
              root.render(
                <div className="flex justify-center relative animate-slide-in-up">
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-15.5">
                    <Flame top="-0.25vh" className="origin-bottom animate-flame-ignition scale-90 scale-y-60" />
                  </div>
                  <img src={logo} alt="Logo" className="size-36 transition-all duration-500 rounded-full bg-radial from-orange-400/15 from-60% to-transparent shadow-[0_0_40px_10px_rgb(251_146_60),0_0_0_4px_rgb(251_146_60/0.08)] opacity-100" />
                </div>
              );

              // (Logo + flame overlay removed per request)
              // Auto-cleanup after animation completes (outward + inward)
              setTimeout(() => {
                container.remove();
              }, 3500);

              // Create Account CTA at bottom with same UI as "I'm Ready"
              if (!document.getElementById('tour-create-account-cta')) {
                const cta = document.createElement('div');
                cta.id = 'tour-create-account-cta';
                cta.className = 'tour-create-account-cta';

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'get-started-btn';
                btn.innerHTML = `
                  <span class="btn-text">Create Account</span>
                  <span class="btn-arrow">
                    <svg width="24" height="24" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6">
                      <path
                        d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                    </svg>
                  </span>
                `;
                btn.onclick = () => {
                  const existing = document.getElementById('floating-popup-container');
                  if (existing) existing.remove();
                  createFloatingPopup({ route: '/signup' });
                };

                cta.appendChild(btn);
                document.body.appendChild(cta);
              }

              return;
            }
            // Further steps are triggered by other actions
          };
          anchor.appendChild(continueBtn);
        }, 300);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(handlePopupOpened);
    }
    
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CREATE_VISUAL_ELEMENT') {
        handlePopupOpened(event.data);
      }
    };
    window.addEventListener('message', handleWindowMessage);
    
    return () => {
      document.title = previousTitle;
      if (pollTimer) clearInterval(pollTimer);
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.removeListener(handlePopupOpened);
      }
      window.removeEventListener('message', handleWindowMessage);
      // Remove window message listener if present
      try { window.removeEventListener('message', (window as any)._tourOnMessage); } catch {}
    };
  }, []);

  return (
    <div className="tour-container">
      {/* Instruction text changes based on pin state */}
      {/* White background */}
      <div className="tour-background"></div>
      
      {/* Squiggly arrow wrapper with fixed position; guide image positioned absolutely relative to it */}
      {!extensionClicked && (
        <div className="tour-arrow">
          <svg 
            viewBox="0 0 300 300" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="arrow-svg"
          >
            <g transform="matrix(2.866928 0 0 2.7726-42.151342-361.726266)">
              <path d="M184.45817,163.48724c16.49325-2.06166,29.20963-21.42272,35.04981-35.04981" transform="matrix(2.093763 0 0 1.610628-344.452366-72.639951)" fill="none" stroke="#ff6b35"/>
              <path d="M219.05803,128.57757c.36866,1.84328,1.0723,3.5632,1.43866,5.39497" transform="matrix(1.728749 0 0 1.14198-264.022798-13.373526)" fill="none" stroke="#ff6b35"/>
              <path d="M219.05803,128.57757c.36866,1.84328,1.0723,3.5632,1.43866,5.39497" transform="matrix(-1.586704-1.373376-.74282 0.858203 558.235564 324.389133)" fill="none" stroke="#ff6b35"/>
            </g>
          </svg>
      
          {/* First text positioned relative to the arrow wrapper */}
          {!isPinned && (
        <TourText
          text="1. Let's start by pinning Intent so it's always easy to find"
              className="tour-first-text"
          fontSize={firstTextPosition.fontSize}
          delay={0.6}
        />
      )}
          {isPinned && (
        <TourText
          text="2. Next, click the Intent icon to open the dashboard"
              className="tour-first-text"
          fontSize={firstTextPosition.fontSize}
          delay={0.1}
        />
      )}

          {/* Guide image positioned absolutely relative to the arrow wrapper */}
          <div className="tour-guide-image">
          {/* Animated "press" hint over the pin icon area (hidden once pinned). */}
          {!isPinned && (
            <div
              className="pin-press"
              style={{
                  top: '58%',
                  right: '22.5%',
              }}
            />
          )}

          {/* After pinned, show a click animation targetting the extension icon area */}
          {isPinned && (
            <>
              {/* Hover rectangle relative to the image container */}
              <div
                className="hover-rect"
                style={{
                    top: '51.5%',
                  left: '34.5%',
                }}
              />
              {/* Mouse click group (pointer + ring) */}
              <div
                className="mouse-click"
                style={{ top: '55%', right: '52%' }}
              >
                {/* Cursor pointer */}
                <svg
                  className="mouse-pointer-svg"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#1f2937"
                  style={{
                    // Fine-tune where the pointer tip sits relative to the ring center
                    ['--pointer-offset-x' as any]: '55%',
                    ['--pointer-offset-y' as any]: '45%',
                  }}
                >
                  <path d="M4 2l14 8-6 2 2 6-3 1-2-6-5 3z" />
                </svg>
                {/* Click ring */}
                <div className="mouse-click-ring" />
              </div>
            </>
          )}
          <img
            src={PinOpen}
            alt="Step 1: Pin the Intent extension, Step 2: Click it to open"
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
          </div>
        </div>
      )}
      
      

     </div>
   );
 };

export default Tour; 