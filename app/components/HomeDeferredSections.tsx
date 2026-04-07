"use client";

import dynamic from "next/dynamic";

const StorySection = dynamic(() => import("./StorySection"), { ssr: false });
const SeductiveSection = dynamic(() => import("./SeductiveSection"), { ssr: false });
const CTASection = dynamic(() => import("./CTASection"), { ssr: false });
const Footer = dynamic(() => import("./Footer"), { ssr: false });
const RevealInit = dynamic(() => import("./RevealInit"), { ssr: false });

export default function HomeDeferredSections() {
  return (
    <>
      <RevealInit />
      <div className="home-story-mobile-hidden">
        <StorySection />
      </div>
      <SeductiveSection />
      <CTASection />
      <Footer />
    </>
  );
}
