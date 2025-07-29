import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../supabaseClient';
import { useEffect, useState } from 'react';
import logo from '@/assets/logo2.png';
import './Auth.css';

interface AuthProps {
  onAuthSuccess: () => void;
  defaultToLogin?: boolean;
  onGoBack?: () => void;
}

export default function AuthComponent({ onAuthSuccess, defaultToLogin = false, onGoBack }: AuthProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, session ? 'Session exists' : 'No session');
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in successfully');
        // For login, call the success callback
        onAuthSuccess();
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out');
        setShowSuccess(false);
        setAuthError(null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed');
      } else if (event === 'USER_UPDATED') {
        console.log('👤 User updated');
      }
    });

    // Simple observer to detect signup confirmation message and errors
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const content = element.textContent || '';
            
            if (content.includes('Check your email for the confirmation link')) {
              console.log('✅ Signup confirmation detected');
              setShowSuccess(true);
            }
            
            // Check for error messages
            if (element.getAttribute('data-supabase-auth-ui') === 'message' || 
                element.getAttribute('role') === 'alert') {
              if (content.includes('Invalid login credentials') || 
                  content.includes('Email not confirmed') ||
                  content.includes('Invalid email or password')) {
                console.log('❌ Auth error detected:', content);
                setAuthError(content);
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      subscription.unsubscribe();
      observer.disconnect();
    };
  }, [onAuthSuccess]);

  // Show success state for signup
  if (showSuccess) {
    return (
      <div className="auth-container">
        {/* Logo */}
        <div style={{
          position: 'relative',
          marginBottom: '2rem',
          width: '120px',
          height: '120px',
          overflow: 'hidden',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeInScale 0.6s ease-out forwards'
        }}>
          <img src={logo} alt="Logo" style={{ 
            width: '80%', 
            height: '80%', 
            objectFit: 'contain' 
          }} />
        </div>

        {/* Confirmation message */}
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '8px',
          padding: '16px 20px',
          color: '#22c55e',
          fontSize: '14px',
          fontFamily: `'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          animation: 'fadeInUp 0.6s ease-out 0.3s forwards',
          opacity: 0
        }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>✓</span>
          Check your email for the confirmation link
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeInScale {
              from {
                opacity: 0;
                transform: scale(0.8);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `
        }} />
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      {/* Back arrow for sign in page */}
      {defaultToLogin && onGoBack && (
        <button
          onClick={onGoBack}
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '14px',
            fontFamily: `'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
            e.currentTarget.style.background = 'none';
          }}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          Back
        </button>
      )}

      {/* Custom title for create account page */}
      {!defaultToLogin && (
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: '500',
            margin: 0,
            fontFamily: `'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap'
          }}>
            Let's make this space yours...
          </h2>
        </div>
      )}

      {/* Show auth error if any */}
      {authError && (
        <div style={{
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#ff6b6b',
          fontSize: '14px',
          textAlign: 'center',
          marginBottom: '16px',
          fontFamily: `'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`,
        }}>
          {authError}
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          /* Error messages - red styling */
          .supabase-auth-ui_ui div[data-supabase-auth-ui="message"],
          .supabase-auth-ui_ui div[role="alert"] {
            background: rgba(255, 107, 107, 0.1) !important;
            border: 1px solid rgba(255, 107, 107, 0.3) !important;
            color: #ff6b6b !important;
            font-size: 14px !important;
            text-align: center !important;
            padding: 12px 16px !important;
            border-radius: 6px !important;
            margin-top: 16px !important;
          }

          /* Hide the "already have an account" link on sign in page */
          ${defaultToLogin ? `
          .supabase-auth-ui_ui a[href*="sign_up"] {
            display: none !important;
          }
          ` : ''}
        `
      }} />
      <Auth
        key={defaultToLogin ? 'signin' : 'signup'}
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#f26419',
                brandAccent: '#e55a00',
                brandButtonText: 'white',
                defaultButtonBackground: 'transparent',
                defaultButtonBackgroundHover: 'rgba(255, 255, 255, 0.1)',
                defaultButtonBorder: 'rgba(255, 255, 255, 0.2)',
                defaultButtonText: 'rgba(255, 255, 255, 0.8)',
                dividerBackground: 'rgba(255, 255, 255, 0.1)',
                inputBackground: 'rgba(255, 255, 255, 0.05)',
                inputBorder: 'rgba(255, 255, 255, 0.1)',
                inputBorderHover: 'rgba(255, 255, 255, 0.2)',
                inputBorderFocus: '#f26419',
                inputText: 'white',
                inputLabelText: 'rgba(255, 255, 255, 0.8)',
                inputPlaceholder: 'rgba(255, 255, 255, 0.4)',
                messageText: 'rgba(255, 255, 255, 0.9)',
                messageTextDanger: '#ff6b6b',
                messageBackground: 'transparent',
                messageBackgroundDanger: 'rgba(255, 107, 107, 0.1)',
                messageBorder: 'transparent',
                messageBorderDanger: 'rgba(255, 107, 107, 0.3)',
                anchorTextColor: '#f26419',
                anchorTextHoverColor: '#e55a00',
              },
              space: {
                spaceSmall: '4px',
                spaceMedium: '8px',
                spaceLarge: '16px',
                labelBottomMargin: '8px',
                anchorBottomMargin: '4px',
                emailInputSpacing: '4px',
                socialAuthSpacing: '4px',
                buttonPadding: '10px 15px',
                inputPadding: '10px 15px',
              },
              fontSizes: {
                baseBodySize: '14px',
                baseInputSize: '16px',
                baseLabelSize: '14px',
                baseButtonSize: '16px',
              },
              fonts: {
                bodyFontFamily: `'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`,
                buttonFontFamily: `'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`,
                inputFontFamily: `'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`,
                labelFontFamily: `'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`,
              },
              borderWidths: {
                buttonBorderWidth: '1px',
                inputBorderWidth: '1px',
              },
              radii: {
                borderRadiusButton: '8px',
                buttonBorderRadius: '8px',
                inputBorderRadius: '8px',
              },
            },
          },
          style: {
            button: {
              background: '#f26419',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: `'Geist', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`,
            },
            anchor: {
              color: '#f26419',
              textDecoration: 'none',
              fontWeight: '500',
            },
            container: {
              background: 'transparent',
            },
            divider: {
              background: 'rgba(255, 255, 255, 0.1)',
              margin: '24px 0',
            },
            label: {
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '6px',
            },
            input: {
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              padding: '12px 16px',
              transition: 'all 0.2s ease',
            },
            message: {
              fontSize: '14px',
              textAlign: 'center' as const,
              padding: '12px 16px',
              borderRadius: '6px',
              marginTop: '16px',
              border: '1px solid transparent',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.9)',
            },
          },
          className: {
            message: 'auth-message',
          },
        }}
        theme="default"
        view={defaultToLogin ? "sign_in" : "sign_up"}
        providers={[]}
        redirectTo={window.location.origin}
        onlyThirdPartyProviders={false}
        magicLink={false}
        showLinks={true} // Show links on both pages
      />
    </div>
  );
}
