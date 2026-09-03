'use client';

import { useEffect } from 'react';

/**
 * Global scroll-reveal initializer.
 * Observes all elements with .reveal / .reveal-left / .reveal-right / .reveal-scale
 * classes and adds .revealed when they enter the viewport.
 * Place once in the website layout.
 */
export default function ScrollRevealInit() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach((el) => {
        el.classList.add('revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    // Observe all current and future reveal elements
    const observeAll = () => {
      document.querySelectorAll('.reveal:not(.revealed), .reveal-left:not(.revealed), .reveal-right:not(.revealed), .reveal-scale:not(.revealed)').forEach((el) => {
        observer.observe(el);
      });
    };

    observeAll();

    // Re-scan on DOM mutations (for dynamically loaded content)
    const mutationObserver = new MutationObserver(observeAll);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}