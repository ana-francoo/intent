import React from 'react';
import smokeImage from '@/assets/smoke1.png';

const SmokeEffect = () => {
  // console.log('Smoke image path:', smokeImage);
  
  return (
    <div style={styles.container}>
      <div style={{ ...styles.smoke, animationDelay: '0s' }} />
      <div style={{ ...styles.smoke, animationDelay: '1.5s' }} />
      <div style={{ ...styles.smoke, animationDelay: '3s' }} />
      <style>{`
        @keyframes rise {
          0% {
            transform: translateX(-50%) translateY(0) scale(1);
            opacity: 0.6;
            filter: blur(2px) hue-rotate(180deg);
          }
          40% {
            transform: translateX(-50%) translateY(-60px) scale(1.05);
            opacity: 0.4;
          }
          80% {
            transform: translateX(-50%) translateY(-120px) scale(1.1);
            opacity: 0.2;
            filter: blur(3px) hue-rotate(190deg);
          }
          100% {
            transform: translateX(-50%) translateY(-200px) scale(1.15);
            opacity: 0;
            filter: blur(4px) hue-rotate(200deg);
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    width: '200px',
    height: '300px',
    overflow: 'visible',
    pointerEvents: 'none',
  },
  smoke: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    width: '100px',
    height: '200px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fallback background
    backgroundImage: `url(${smokeImage})`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    opacity: 0.8,
    transform: 'translateX(-50%)',
    animation: 'rise 4s ease-in-out infinite',
    filter: 'blur(1px) brightness(1.1)',
    willChange: 'transform, opacity, filter',
    border: '1px solid rgba(255, 255, 255, 0.3)', // Debug border to see the div
  },
};

export default SmokeEffect;
