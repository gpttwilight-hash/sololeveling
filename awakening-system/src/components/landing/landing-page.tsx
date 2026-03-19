"use client";

import { LandingNav } from "./landing-nav";
import { HeroSection } from "./hero-section";
import { ProblemSection } from "./problem-section";
import { FeaturesSection } from "./features-section";
import { RanksSection } from "./ranks-section";
import { HowItWorksSection } from "./how-it-works-section";
import { PricingSection } from "./pricing-section";
import { FinalCtaSection } from "./final-cta-section";
import { LandingFooter } from "./landing-footer";

export function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "#0A0A0F", color: "#F0F0F5" }}
    >
      <LandingNav />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <RanksSection />
      <HowItWorksSection />
      <PricingSection />
      <FinalCtaSection />
      <LandingFooter />
    </div>
  );
}
