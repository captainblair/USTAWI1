"use client";

import { ArrowUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ScrollTone = "red" | "navy";

const SCROLL_THRESHOLD = 320;

function resolveToneAtButton(): ScrollTone {
  if (typeof window === "undefined") return "navy";

  const x = 48;
  const y = window.innerHeight - 48;
  const stack = document.elementsFromPoint(x, y);

  for (const el of stack) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.closest("[data-scroll-top-button]")) continue;

    let node: HTMLElement | null = el;
    while (node) {
      const tone = node.dataset.scrollTone;
      if (tone === "red" || tone === "navy") {
        return tone;
      }
      node = node.parentElement;
    }
  }

  return "navy";
}

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [tone, setTone] = useState<ScrollTone>("navy");

  const update = useCallback(() => {
    setVisible(window.scrollY > SCROLL_THRESHOLD);
    setTone(resolveToneAtButton());
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      data-scroll-top-button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={cn(
        "fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white/90 shadow-[0_4px_20px_rgba(10,17,40,0.12)] backdrop-blur-sm transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        tone === "red"
          ? "border-ustawi-red text-ustawi-red hover:border-ustawi-navy hover:bg-white hover:text-ustawi-navy"
          : "border-ustawi-navy text-ustawi-navy hover:border-ustawi-red hover:bg-white hover:text-ustawi-red",
      )}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
