import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import AdvantagesSection from "@/components/sections/AdvantagesSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import DashboardPreviewSection from "@/components/sections/DashboardPreviewSection";
import BenefitsSection from "@/components/sections/BenefitsSection";
import MobileAppSection from "@/components/sections/MobileAppSection";
import ProjectionsSection from "@/components/sections/ProjectionsSection";
import ActionListsSection from "@/components/sections/ActionListsSection";
import ConnectivitySection from "@/components/sections/ConnectivitySection";
import SecuritySection from "@/components/sections/SecuritySection";
import UseCasesSection from "@/components/sections/UseCasesSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import CTASection from "@/components/sections/CTASection";
import { PricingSection } from "@/components/sections/PricingSection";
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/layout/CookieBanner";
import { SalesChatWidget } from "@/components/landing/SalesChatWidget";

// Detecta si la app está instalada como PWA
const isInstalledPWA = () => {
  // Check for standalone mode (installed PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  // Check for iOS standalone mode
  const isIOSStandalone = (window.navigator as any).standalone === true;
  // Check for Android TWA
  const isAndroidTWA = document.referrer.includes('android-app://');
  
  return isStandalone || isIOSStandalone || isAndroidTWA;
};

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Si está instalada como PWA, ir directo al login
    if (isInstalledPWA()) {
      navigate('/auth', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <AdvantagesSection />
        <FeaturesSection />
        <DashboardPreviewSection />
        <BenefitsSection />
        <PricingSection />
        <MobileAppSection />
        <ProjectionsSection />
        <ActionListsSection />
        <ConnectivitySection />
        <SecuritySection />
        <UseCasesSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
      <CookieBanner />
      <SalesChatWidget />
    </div>
  );
};

export default Index;
