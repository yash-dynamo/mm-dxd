import Navbar from "./components/Navbar";
import Ticker from "./components/Ticker";
import HeroSection from "./components/HeroSection";
// import SplashScreen from "./components/SplashScreen";
import HomeDeferredSections from "./components/HomeDeferredSections";

export default function Home() {
  return (
    <>
      {/* <SplashScreen /> */}
      <main className="landing-main">
        <div className="landing-header">
          <Navbar />
          <Ticker />
        </div>
        <HeroSection />
        <HomeDeferredSections />
      </main>
    </>
  );
}
