import { useState, useEffect } from 'react';
import './HowItWorks.css';
import IntentOnboarding from './IntentOnboarding';

interface SlideData {
  id: number;
  title: string;
  text: string;
  icon: string;
  isNextButton?: boolean;
}

interface HowItWorksProps {
  onLastSlideViewed?: () => void;
  onNext?: () => void;
}

const baseSlides: SlideData[] = [
  {
    id: 1,
    title: "Set Your Intention",
    text: "When you want to use a potentially distracting site, Intent will prompt you to declare your clear intention.",
    icon: "✍️"
  },
  {
    id: 2,
    title: "Stay Focused",
    text: "Intent monitors your activity and ensures you stay aligned with your declared intention.",
    icon: "🎯"
  },
  {
    id: 3,
    title: "Gentle Reminders",
    text: "If your activity drifts from your intention, Intent gently steps in and reblocks the site to help you refocus.",
    icon: "🔒"
  },
  {
    id: 4,
    title: "Build Better Habits",
    text: "Over time, Intent helps you develop healthier browsing habits and maintain focus on what matters most.",
    icon: "🌱"
  }
];

const nextSlide: SlideData = {
  id: 5,
  title: "Ready to Start?",
  text: "Now that you understand how Intent works, let's set up your account and get started!",
  icon: "🚀",
  isNextButton: true
};

// Always include all slides
const allSlides = [...baseSlides, nextSlide];

export default function HowItWorks({ onLastSlideViewed, onNext }: HowItWorksProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasViewedLastSlide, setHasViewedLastSlide] = useState(false);

  // Check if user has reached the last content slide (slide 4)
  useEffect(() => {
    if (currentSlide === baseSlides.length - 1 && !hasViewedLastSlide) {
      setHasViewedLastSlide(true);
      onLastSlideViewed?.();
    }
  }, [currentSlide, hasViewedLastSlide, onLastSlideViewed]);

  const nextSlideHandler = () => {
    if (currentSlide < allSlides.length - 1) {
      // Don't allow going to slide 5 unless they've viewed slide 4
      if (currentSlide === allSlides.length - 2 && !hasViewedLastSlide) {
        return;
      }
      setCurrentSlide((prev) => prev + 1);
    } else {
      setCurrentSlide(0); // Loop back to first slide
    }
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + allSlides.length) % allSlides.length);
  };

  const goToSlide = (index: number) => {
    // Don't allow going to slide 5 unless they've viewed slide 4
    if (index === allSlides.length - 1 && !hasViewedLastSlide) {
      return;
    }
    setCurrentSlide(index);
  };

  const handleNextButtonClick = () => {
    onNext?.();
  };

  return (
    <div className="how-it-works-container">
      <IntentOnboarding onComplete={handleNextButtonClick} />
    </div>
  );
}
