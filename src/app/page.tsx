import { HomeHeader } from "@/components/home/HomeHeader";
import { auth } from "@/auth";
import { HeroSection } from "@/components/home/HeroSection";
import { AboutSection } from "@/components/home/AboutSection";
import { ValuesSection } from "@/components/home/ValuesSection";
import { DocumentsSection } from "@/components/home/DocumentsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { FooterSection } from "@/components/home/FooterSection";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-bkg dark:bg-bkg">
      <HomeHeader />
      <main className="overflow-x-hidden">
        <HeroSection />
        <AboutSection />
        <ValuesSection />
        <DocumentsSection />
        <ContactSection />
      </main>
      <FooterSection />
    </div>
  );
}
