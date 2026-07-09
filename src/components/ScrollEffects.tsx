"use client";

import { useEffect } from "react";

/**
 * Replicates the original scroll-event behaviour:
 * shrinks the header, hides the intro blurb, sticks + highlights the
 * "Recent Work" heading and animates the footer once the user scrolls.
 * Renders nothing — it only toggles classes on existing DOM nodes.
 */
export default function ScrollEffects() {
  useEffect(() => {
    const header = document.querySelector(".site-header");
    const logo = document.querySelector(".logo-box");
    const introBlurb = document.querySelector(".intro-blurb");
    const footer = document.querySelector(".site-footer");
    const headingSection = document.querySelector("#recent-work-heading");
    const heading = document.querySelector("#recent-work-heading .section-title");

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const isPastThreshold = window.scrollY > 100;

        header?.classList.toggle("scrolled", isPastThreshold);
        logo?.classList.toggle("scrolled", isPastThreshold);
        introBlurb?.classList.toggle("hide-intro", isPastThreshold);
        footer?.classList.toggle("scrolled", isPastThreshold);
        headingSection?.classList.toggle("scrolled", isPastThreshold);

        if (headingSection && heading) {
          const top = headingSection.getBoundingClientRect().top;
          heading.classList.toggle("underline", top >= 35);
          heading.classList.toggle("highlight", top <= 35);
        }

        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
