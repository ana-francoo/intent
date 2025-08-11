import React from 'react';
import './TourText.css';

interface TourTextProps {
  text: string;
  position: {
    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
  };
  fontSize?: number;
  delay?: number;
  className?: string;
}

const TourText: React.FC<TourTextProps> = ({ 
  text, 
  position, 
  fontSize = 18,
  delay = 0.3,
  className = ''
}) => {
  return (
    <div 
      className={`tour-text ${className}`}
      style={{
        position: 'fixed',
        ...position,
        fontSize: `${fontSize}px`,
        animationDelay: `${delay}s`
      }}
    >
      {text}
    </div>
  );
};

export default TourText; 