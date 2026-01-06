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
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/layout/CookieBanner";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <AdvantagesSection />
        <FeaturesSection />
        <DashboardPreviewSection />
        <BenefitsSection />
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
    </div>
  );
};

export default Index;
