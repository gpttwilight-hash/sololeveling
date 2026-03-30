"use client";

import { DottedSurface } from "@/components/ui/dotted-surface";
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
    <div style={{ minHeight: "100vh", background: "#06060C", color: "#EEEEF0" }}>
      <DottedSurface />
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
