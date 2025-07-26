import { useState, useEffect } from 'react';
import './HowItWorks.css';

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
      <h1 className="how-it-works-title">How it works</h1>
      
      <div className="carousel-container">
        <div className="carousel-wrapper">
          {/* Left Arrow */}
          <button 
            className="carousel-arrow carousel-arrow-left"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Slide Container */}
          <div className="carousel-slide-container">
            <div 
              className="carousel-slides"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {allSlides.map((slide, index) => (
                <div key={slide.id} className="carousel-slide">
                  <div className="slide-content">
                    {slide.isNextButton ? (
                      <>
                        <div className="slide-icon">{slide.icon}</div>
                        <h3 className="slide-title">{slide.title}</h3>
                        <p className="slide-text">{slide.text}</p>
                        <button 
                          className="next-button"
                          onClick={handleNextButtonClick}
                        >
                          Get Started
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="slide-icon">{slide.icon}</div>
                        <h3 className="slide-title">{slide.title}</h3>
                        <p className="slide-text">{slide.text}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          <button 
            className="carousel-arrow carousel-arrow-right"
            onClick={nextSlideHandler}
            aria-label="Next slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Navigation Dots */}
        <div className="carousel-dots">
          {allSlides.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentSlide ? 'active' : ''} ${
                index === allSlides.length - 1 && !hasViewedLastSlide ? 'disabled' : ''
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              disabled={index === allSlides.length - 1 && !hasViewedLastSlide}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
