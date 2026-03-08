import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import PainPointsSection from "@/components/sections/PainPointsSection";
import SolutionSection from "@/components/sections/SolutionSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import BenefitsSection from "@/components/sections/BenefitsSection";
import DashboardPreviewSection from "@/components/sections/DashboardPreviewSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import { PricingSection } from "@/components/sections/PricingSection";
import ConnectivitySection from "@/components/sections/ConnectivitySection";
import CTASection from "@/components/sections/CTASection";
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/layout/CookieBanner";
import { SalesChatWidget } from "@/components/landing/SalesChatWidget";

const isInstalledPWA = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;
  const isAndroidTWA = document.referrer.includes('android-app://');
  return isStandalone || isIOSStandalone || isAndroidTWA;
};

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isInstalledPWA()) {
      navigate('/auth', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <PainPointsSection />
        <SolutionSection />
        <FeaturesSection />
        <BenefitsSection />
        <DashboardPreviewSection />
        <TestimonialsSection />
        <PricingSection />
        <ConnectivitySection />
        <CTASection />
      </main>
      <Footer />
      <CookieBanner />
      <SalesChatWidget />
    </div>
  );
};

export default Index;
