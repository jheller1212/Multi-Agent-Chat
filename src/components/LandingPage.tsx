import React from 'react';
import { Navigation } from './Navigation';
import { HeroSection } from './HeroSection';
import { ResearchAreas } from './ResearchAreas';
import { ResearchFocus } from './ResearchFocus';
import { FAQ } from './FAQ';
import { AcademicCTA } from './AcademicCTA';
import { Footer } from './Footer';

interface LandingPageProps {
  onAuthClick: () => void;
  onSignUpClick: () => void;
  isAuthenticated: boolean;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
}

export function LandingPage({ onAuthClick, onSignUpClick, isAuthenticated, onPrivacyClick, onTermsClick }: LandingPageProps) {
  return (
    <div className="bg-gradient-to-b from-orange-50 via-white to-sky-50">
      <Navigation onAuthClick={onAuthClick} onSignUpClick={onSignUpClick} isAuthenticated={isAuthenticated} />
      <HeroSection onSignUpClick={onSignUpClick} />
      <ResearchAreas />
      <ResearchFocus />
      <div id="faq">
        <FAQ />
      </div>
      <AcademicCTA onSignUpClick={onSignUpClick} />
      <Footer onPrivacyClick={onPrivacyClick} onTermsClick={onTermsClick} />
    </div>
  );
}
