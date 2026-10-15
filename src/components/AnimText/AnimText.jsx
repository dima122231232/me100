"use client";

import "./AnimText.css";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(SplitText, ScrambleTextPlugin);

export default function AnimText({ children }) {
    const containerRef = useRef(null);
    const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()-_=+<>/?";
    const COLORS = ["#E486F1","#80AB10","#9889E9","#ED370B","#EFD525" , "red"]

    useGSAP(() => {
        const element = containerRef.current;

        SplitText.create(element.firstElementChild, {
            type: "lines, chars",
            linesClass: "line",
            charsClass: "chars",
            autoSplit: true,
        });

        const lines = element.querySelectorAll(".line");
        const textClone = Array.from(lines, (line) => line.cloneNode(true));
        

        const handleMouseEnter = (line) => {
            const chars = line.querySelectorAll(".chars");

            chars.forEach((char, index) => {
                if (!char.textContent.trim()) return;

                const randomChar = CHARS[Math.floor(Math.random() * CHARS.length)];

                gsap.to(char, {
                    duration: .35,
                    // color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    color:"red",
                    ...(Math.random() < .5 ? { borderColor: COLORS[Math.floor(Math.random() * COLORS.length)] } : {}),
                    delay: index * 0.01,
                    scrambleText: {
                        text: randomChar,
                        chars: CHARS,
                        speed: .25,
                        rightToLeft: false,
                    },
                });
            });
        };

        const handleMouseLeave = (line, index) => {
            const chars = line.querySelectorAll(".chars");
            const originalChars = textClone[index].querySelectorAll(".chars");

            chars.forEach((char, charIndex) => {
                const originalText = originalChars[charIndex]?.textContent;

                if (!originalText?.trim()) return;

                gsap.to(char, {
                    duration: .35,
                    color: "#fff",
                    borderColor:"transparent",
                    delay:.5 + charIndex * .01,
                    scrambleText: {
                        text: originalText,
                        chars: CHARS,
                        speed: .25,
                        rightToLeft: false,
                    },
                });
            });
        };

        lines.forEach((line , index) => {
            line.addEventListener("mouseenter", () => handleMouseEnter(line));
            line.addEventListener("mouseleave", () => handleMouseLeave(line , index));
        });
    }, { scope: containerRef });

    return (
        <span ref={containerRef} className="AnimText">
            {children}
        </span>
    );
}