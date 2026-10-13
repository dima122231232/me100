"use client";

import { useEffect } from "react";
import { ReactLenis, useLenis as useLenisInstance } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.config({
    ignoreMobileResize: true,
});

const LENIS_OPTIONS = {
    autoRaf: false,
    autoResize: true,
    autoToggle: true,

    smoothWheel: true,

    syncTouch: false,

    wheelMultiplier: 1,

    direction: "vertical",
    gestureDirection: "vertical",

    anchors: true,
    stopInertiaOnNavigate: true,

    respectReducedMotion: true,
    overscroll: true,
};

export const useLenis = useLenisInstance;

function LenisGSAPSync({ children }) {
    const lenis = useLenisInstance();

    useEffect(() => {
        if (!lenis) {
            return undefined;
        }

        const update = (time) => {
            lenis.raf(time * 1000);
        };

        const updateScrollTrigger = () => {
            ScrollTrigger.update();
        };

        lenis.on(
            "scroll",
            updateScrollTrigger
        );

        gsap.ticker.add(update);
        gsap.ticker.lagSmoothing(0);

        const refreshFrame = requestAnimationFrame(() => {
            ScrollTrigger.refresh();
        });

        return () => {
            lenis.off(
                "scroll",
                updateScrollTrigger
            );

            gsap.ticker.remove(update);
            cancelAnimationFrame(refreshFrame);
        };
    }, [lenis]);

    return children;
}

export default function LenisProvider({ children }) {
    return (
        <ReactLenis
            root
            options={LENIS_OPTIONS}
        >
            <LenisGSAPSync>{children}</LenisGSAPSync>
        </ReactLenis>
    );
}