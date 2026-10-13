"use client";

import "./AnimText.css";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

export default function AnimText({ children }) {
const containerRef = useRef(null);
    
    useGSAP(() => {
    const element = containerRef.current;

    SplitText.create(element.firstElementChild, {
        type: "lines",
        autoSplit: true
    });

    const handleMouseEnter = () => {
        gsap.to(element, {
            opacity: 0,
            duration: .3,
            ease: "power2.out",
        });
    };

    const handleMouseLeave = () => {
        gsap.to(element, {
            opacity: 1,
            duration: .3,
            ease: "power2.out",
        });
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
        element.removeEventListener("mouseenter", handleMouseEnter);
        element.removeEventListener("mouseleave", handleMouseLeave);
    };
    },{ scope: containerRef });

    return (
        <span ref={containerRef} className="AnimText">
            {children}
        </span>
    );
}