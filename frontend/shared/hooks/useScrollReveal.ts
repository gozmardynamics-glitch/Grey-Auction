'use client';

import { useEffect, useRef, useState } from 'react';

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

/**
 * Scroll-reveal hook using IntersectionObserver.
 * Adds the 'revealed' class to the target element when it enters the viewport.
 * Works with the .reveal / .reveal-left / .reveal-right / .reveal-scale CSS classes.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollRevealOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px 0px -60px 0px', once = true } = options;
  const ref = useRef<T>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setIsRevealed(true);
      el.classList.add('revealed');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          el.classList.add('revealed');
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsRevealed(false);
          el.classList.remove('revealed');
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isRevealed };
}

/**
 * Batch reveal for a list of items. Each child gets a staggered delay.
 * Apply 'reveal' class to each child; this hook adds 'revealed' with stagger.
 */
export function useStaggerReveal<T extends HTMLElement = HTMLDivElement>(
  count: number,
  options: UseScrollRevealOptions & { staggerMs?: number } = {}
) {
  const { staggerMs = 80, ...observerOpts } = options;
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const children = Array.from(container.children) as HTMLElement[];

    if (prefersReduced) {
      children.forEach((child) => child.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = children.indexOf(entry.target as HTMLElement);
            const delay = index * staggerMs;
            setTimeout(() => {
              (entry.target as HTMLElement).classList.add('revealed');
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: observerOpts.threshold ?? 0.1, rootMargin: observerOpts.rootMargin ?? '0px 0px -40px 0px' }
    );

    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [count, staggerMs, observerOpts.threshold, observerOpts.rootMargin]);

  return containerRef;
}