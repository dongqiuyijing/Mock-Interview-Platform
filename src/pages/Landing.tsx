import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { Steps } from "@/components/landing/Steps";
import { Bento } from "@/components/landing/Bento";
import { CtaStatement } from "@/components/landing/CtaStatement";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <Marquee />
        <Steps />
        <Bento />
        <CtaStatement />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
