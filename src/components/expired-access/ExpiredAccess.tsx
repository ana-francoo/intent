import React, { useState } from 'react';
import { createCheckoutSession, formatTimeRemaining } from '../../utils/subscription';
import logo from '@/assets/logo2.png';
import './ExpiredAccess.css';

interface ExpiredAccessProps {
  daysRemaining: number;
  planType: 'trial' | 'yearly' | 'expired';
  onClose?: () => void;
}

const ExpiredAccess: React.FC<ExpiredAccessProps> = ({ 
  daysRemaining, 
  planType, 
  onClose 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLevelUp = async () => {
    try {
      setIsLoading(true);
      await createCheckoutSession();
    } catch (error) {
      console.error('Failed to start checkout:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isExpired = planType === 'expired';
  const isTrialEnding = planType === 'trial' && daysRemaining <= 3;

  return (
    <div className="expired-access-overlay">
      <div className="expired-access-container">
        {/* Logo */}
        <div className="expired-access-logo">
          <img src={logo} alt="Intent Logo" />
        </div>

        {/* Content */}
        <div className="expired-access-content">
          {isExpired ? (
            <>
              <h2 className="expired-access-title">Your free trial has ended</h2>
              <p className="expired-access-subtitle">
                Continue your focused browsing journey with Intent Pro
              </p>
            </>
          ) : isTrialEnding ? (
            <>
              <h2 className="expired-access-title">Your trial is ending soon</h2>
              <p className="expired-access-subtitle">
                {formatTimeRemaining(daysRemaining)} • Upgrade now to keep your focus
              </p>
            </>
          ) : (
            <>
              <h2 className="expired-access-title">Upgrade to Intent Pro</h2>
              <p className="expired-access-subtitle">
                {formatTimeRemaining(daysRemaining)} • Get unlimited access
              </p>
            </>
          )}

          {/* Features */}
          <div className="expired-access-features">
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span className="feature-text">Unlimited intention tracking</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚫</span>
              <span className="feature-text">Block unlimited websites</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span className="feature-text">Advanced focus analytics</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔮</span>
              <span className="feature-text">AI-powered intention matching</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="expired-access-pricing">
            <div className="price-main">
              <span className="price-amount">$29</span>
              <span className="price-period">/year</span>
            </div>
            <div className="price-detail">
              Less than $2.50/month • 7-day money-back guarantee
            </div>
          </div>

          {/* Action Button */}
          <button 
            className="level-up-btn"
            onClick={handleLevelUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Processing...
              </>
            ) : (
              'Level Up to Intent Pro'
            )}
          </button>

          {/* Close button for trial users */}
          {!isExpired && onClose && (
            <button className="continue-trial-btn" onClick={onClose}>
              Continue with trial
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="expired-access-footer">
          <p>Secure payment powered by Stripe • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
};

export default ExpiredAccess; 