import Navbar from "./components/Navbar";
import Ticker from "./components/Ticker";
import HeroSection from "./components/HeroSection";
import StorySection from "./components/StorySection";
import SeductiveSection from "./components/SeductiveSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
import SplashScreen from "./components/SplashScreen";
import RevealInit from "./components/RevealInit";

export default function Home() {
  return (
    <>
      <SplashScreen />
      <RevealInit />
      <main className="landing-main">
        <Navbar />
        <Ticker />
        <HeroSection />
        <StorySection />
        <SeductiveSection />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
