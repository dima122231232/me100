"use client";

import "./Copy.css";

import React, { useRef } from "react";

import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, ScrollTrigger);

const REQUIRED_FONTS = ["PP", "Aeonik"];

const TEXT_SELECTOR =
  "h1,h2,h3,h4,h5,h6,p,a,li,label,blockquote,figcaption,span";



async function waitForFonts() {
  try {
    await document.fonts.ready;

    await Promise.all(
      REQUIRED_FONTS.map((font) =>
        document.fonts.load(`16px "${font}"`)
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

function resolveTriggerElement(selector, fallback) {
  if (typeof selector === "string" && selector.trim().length > 0) {
    return (
      fallback.closest(selector) || document.querySelector(selector) || fallback
    );
  }
  return fallback;
}

function getAnimatableElements(root) {
  const candidates = Array.from(root.querySelectorAll(TEXT_SELECTOR)).filter(
    (el) => root.contains(el) && el.textContent?.trim(),
  );

  const leaves = candidates.filter(
    (el) => !candidates.some((other) => other !== el && el.contains(other)),
  );

  if (leaves.length > 0) {
    return leaves;
  }

  if (root.hasAttribute("data-copy-wrapper") && root.children.length > 0) {
    return Array.from(root.children);
  }

  return [root];
}

function preserveTextIndent(element, units) {
  const computedStyle = window.getComputedStyle(element);
  const textIndent = computedStyle.textIndent;
  if (textIndent && textIndent !== "0px" && units.length > 0) {
    units[0].style.paddingLeft = textIndent;
    element.style.textIndent = "0";
  }
}

function attachScrollTrigger(
  scrollTriggerRefs,
  { animateOnScroll, triggerElement, start, animation, onEnter },
) {
  if (!animateOnScroll) return;

  const scrollTrigger = ScrollTrigger.create({
    trigger: triggerElement,
    start,
    once: true,
    refreshPriority: -1,
    ...(onEnter
      ? { onEnter }
      : { animation, toggleActions: "play none none none" }),
  });

  scrollTriggerRefs.current.push(scrollTrigger);
}

export default function Copy({
  children,
  animateOnScroll = true,
  delay = 0,
  duration = 1.05,
  stagger = null,
  type = "lines",
  trigger = null,
  triggerPoint = null,
  start = null,
  onAnimationReady = null,
}) {
  const containerRef = useRef(null);
  const splitInstanceRefs = useRef([]);
  const scrollTriggerRefs = useRef([]);
  const combinedTweenRef = useRef(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      let isActive = true;
      let rebuildTimer = null;


    const setSlideReady = (ready) => {
    if (!containerRef.current) return;

    containerRef.current.classList.toggle("copy-slide-ready", ready);
    };

      const cleanupInstances = () => {
        if (rebuildTimer) {
          clearTimeout(rebuildTimer);
          rebuildTimer = null;
        }

        combinedTweenRef.current?.kill();
        combinedTweenRef.current = null;

        scrollTriggerRefs.current.forEach((st) => st?.kill());
        scrollTriggerRefs.current = [];

        splitInstanceRefs.current.forEach((split) => split?.revert());
        splitInstanceRefs.current = [];

        setSlideReady(false);
      };

      const scheduleCombinedRebuild = (run) => {
        if (rebuildTimer) clearTimeout(rebuildTimer);
        rebuildTimer = setTimeout(() => {
          rebuildTimer = null;
          if (isActive) run();
        }, 50);
      };

      const buildAnimations = async () => {
        await waitForFonts();
        if (!isActive || !containerRef.current) return;

        cleanupInstances();

        const root = containerRef.current;
        const targetElements = getAnimatableElements(root);

        const resolvedStart = start ?? "top 80%";
        const resolvedStagger = stagger ?? 0.1;

        const triggerElement = resolveTriggerElement(
          triggerPoint ?? trigger,
          root,
        );



        const runCombinedAnimation = () => {
          combinedTweenRef.current?.kill();
          scrollTriggerRefs.current.forEach((st) => st?.kill());
          scrollTriggerRefs.current = [];

          const allUnits = [];

          targetElements.forEach((element, index) => {
            const split = splitInstanceRefs.current[index];
            if (!split) return;

            const units = type === "words" ? split.words : split.lines;
            preserveTextIndent(element, units);
            allUnits.push(...units);
          });

          if (allUnits.length === 0) {
            setSlideReady(true);
            return;
          }

          gsap.set(allUnits, { yPercent: 110 });
          setSlideReady(true);

          combinedTweenRef.current = gsap.to(allUnits, {
            yPercent: 0,
            duration,
            ease: "power3.out",
            delay,
            stagger: resolvedStagger,
            paused: animateOnScroll,
          });

        onAnimationReady?.(() => combinedTweenRef.current?.restart());

          attachScrollTrigger(scrollTriggerRefs, {
            animateOnScroll,
            triggerElement,
            start: resolvedStart,
            animation: combinedTweenRef.current,
          });
        };

        const createSplits = () => {
          setSlideReady(false);

          splitInstanceRefs.current.forEach((split) => split?.revert());
          splitInstanceRefs.current = [];

          const isWordSplit = type === "words";

          targetElements.forEach((element) => {
            const split = SplitText.create(element, {
              type: isWordSplit ? "words" : "lines",
              mask: isWordSplit ? "words" : "lines",
              autoSplit: true,
              ...(isWordSplit
                ? { wordsClass: "word" }
                : { linesClass: "line", lineThreshold: 0.1 }),
              onSplit: () => scheduleCombinedRebuild(runCombinedAnimation),
            });
            const LINE_OFFSET = 0.25;

            split.lines.forEach((line, index) => {
                if (index === 0) return;

                gsap.set(line.parentElement, {
                    y: `${-LINE_OFFSET * index}rem`,
                });
            });
            splitInstanceRefs.current.push(split);
          });
        };

        createSplits();
      };

      buildAnimations();

      return () => {
        isActive = false;
        cleanupInstances();
      };
    },
    {
      scope: containerRef,
      dependencies: [
        animateOnScroll,
        delay,
        stagger,
        type,
        trigger,
        triggerPoint,
        start,
      ],
    },
  );

    const copyAttrs = { "data-copy-slide": "" };

  if (React.Children.count(children) === 1 && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: containerRef,
      ...copyAttrs,
    });
  }

  return (
    <div ref={containerRef} data-copy-wrapper="true" {...copyAttrs}>
      {children}
    </div>
  );
}
