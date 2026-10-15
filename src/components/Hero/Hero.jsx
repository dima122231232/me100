"use client";

import "./Hero.css";
import { useEffect, useRef } from "react";
import useMouseOverlay from "./useMouseOverlay";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";


gsap.registerPlugin(ScrollTrigger);

const CELL_SIZE = 22;
const CELL_GAP = -3;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const FPS = 15;

const ASCII_CHARS = "K$#MGWF@";
const CLUSTER_COUNT = ASCII_CHARS.length;
const KMEANS_ITERATIONS = 5;

const colorDistance = (a, b) => {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;

    return dr * dr + dg * dg + db * db;
};

const getNearestCluster = (cell, clusters) => {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < clusters.length; i++) {
        const distance = colorDistance(cell, clusters[i]);

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
        }
    }

    return nearestIndex;
};


export default function Hero() {
    const contentRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const { overlayRef, setupOverlay, renderOverlay } = useMouseOverlay(
        contentRef,
        CELL_SIZE,
        CELL_STEP
    );

    useEffect(() => {
        const content = contentRef.current;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!content || !video || !canvas) return;

        const asciiFont = getComputedStyle(content)
            .getPropertyValue("--font-main")
            .trim() || "sans-serif";

        const ctx = canvas.getContext("2d");
        const sampleCanvas = document.createElement("canvas");
        const sampleCtx = sampleCanvas.getContext("2d", {
            willReadFrequently: true,
        });

        if (!ctx || !sampleCtx) return;

        let cols = 0;
        let rows = 0;
        let cells = [];
        let colorClusters = [];
        let dpr = window.devicePixelRatio || 1;
        let lastFrameTime = 0;
        let animationFrameId = 0;
        let destroyed = false;
        let isAsciiActive = false;
        let isInitialized = false;

        const setupCanvas = () => {
            if (destroyed) return;

            const width = content.clientWidth;
            const height = content.clientHeight;

            if (!width || !height) return;

            dpr = window.devicePixelRatio || 1;

            cols = Math.floor(width / CELL_STEP) + 1;
            rows = Math.floor(height / CELL_STEP) + 1;

            if (!cols || !rows) return;

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            sampleCanvas.width = cols;
            sampleCanvas.height = rows;

            cells = [];
            colorClusters = [];

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    cells.push({
                        col,
                        row,
                        r: 0,
                        g: 0,
                        b: 0,
                        color: "#000",
                        char: ASCII_CHARS[0],
                    });
                }
            }

            setupOverlay(width, height, dpr, cols, rows);
        };

        const clusterCells = () => {
            if (!cells.length) return;

            const clusterCount = Math.min(CLUSTER_COUNT, cells.length);

            if (colorClusters.length !== clusterCount) {
                let r = 0;
                let g = 0;
                let b = 0;

                for (const cell of cells) {
                    r += cell.r;
                    g += cell.g;
                    b += cell.b;
                }

                colorClusters = [{
                    r: r / cells.length,
                    g: g / cells.length,
                    b: b / cells.length,
                }];

                while (colorClusters.length < clusterCount) {
                    let farthestCell = cells[0];
                    let farthestDistance = -1;

                    for (const cell of cells) {
                        let nearestDistance = Infinity;

                        for (const cluster of colorClusters) {
                            const distance = colorDistance(cell, cluster);

                            if (distance < nearestDistance) {
                                nearestDistance = distance;
                            }
                        }

                        if (nearestDistance > farthestDistance) {
                            farthestDistance = nearestDistance;
                            farthestCell = cell;
                        }
                    }

                    colorClusters.push({
                        r: farthestCell.r,
                        g: farthestCell.g,
                        b: farthestCell.b,
                    });
                }
            }

            const errors = new Float64Array(cells.length);

            for (let iteration = 0; iteration < KMEANS_ITERATIONS; iteration++) {
                const sums = Array.from(
                    { length: clusterCount },
                    () => ({ r: 0, g: 0, b: 0, count: 0 })
                );

                for (let i = 0; i < cells.length; i++) {
                    const cell = cells[i];

                    let nearestIndex = 0;
                    let nearestDistance = Infinity;

                    for (let j = 0; j < clusterCount; j++) {
                        const distance = colorDistance(cell, colorClusters[j]);

                        if (distance < nearestDistance) {
                            nearestDistance = distance;
                            nearestIndex = j;
                        }
                    }

                    errors[i] = nearestDistance;

                    sums[nearestIndex].r += cell.r;
                    sums[nearestIndex].g += cell.g;
                    sums[nearestIndex].b += cell.b;
                    sums[nearestIndex].count++;
                }

                for (let j = 0; j < clusterCount; j++) {
                    const sum = sums[j];

                    if (sum.count > 0) {
                        colorClusters[j] = {
                            r: sum.r / sum.count,
                            g: sum.g / sum.count,
                            b: sum.b / sum.count,
                        };
                    }
                }

                const used = new Set();

                for (let j = 0; j < clusterCount; j++) {
                    if (sums[j].count > 0) continue;

                    let farthestIndex = -1;
                    let farthestDistance = -1;

                    for (let i = 0; i < cells.length; i++) {
                        if (used.has(i)) continue;

                        if (errors[i] > farthestDistance) {
                            farthestDistance = errors[i];
                            farthestIndex = i;
                        }
                    }

                    if (farthestIndex !== -1) {
                        const cell = cells[farthestIndex];

                        colorClusters[j] = {
                            r: cell.r,
                            g: cell.g,
                            b: cell.b,
                        };

                        used.add(farthestIndex);
                    }
                }
            }

            for (const cell of cells) {
                const clusterIndex = getNearestCluster(cell, colorClusters);

                cell.char = ASCII_CHARS[clusterIndex];
            }
        };

        const videoAnalysis = () => {
            if (video.readyState < 2 || !video.videoWidth) return false;
            if (!cols || !rows || !cells.length) return false;

            const sourceWidth = video.videoWidth;
            const sourceHeight = video.videoHeight;
            const targetRatio = cols / rows;
            const sourceRatio = sourceWidth / sourceHeight;

            if (getComputedStyle(video).objectFit === "cover") {
                let sx = 0;
                let sy = 0;
                let sw = sourceWidth;
                let sh = sourceHeight;

                if (sourceRatio > targetRatio) {
                    sw = sourceHeight * targetRatio;
                    sx = (sourceWidth - sw) / 2;
                } else {
                    sh = sourceWidth / targetRatio;
                    sy = (sourceHeight - sh) / 2;
                }

                sampleCtx.drawImage(
                    video,
                    sx, sy, sw, sh,
                    0, 0, cols, rows
                );
            } else {
                sampleCtx.drawImage(video, 0, 0, cols, rows);
            }

            const { data } = sampleCtx.getImageData(0, 0, cols, rows);

            for (let i = 0; i < cells.length; i++) {
                const idx = i * 4;
                const cell = cells[i];

                cell.r = data[idx];
                cell.g = data[idx + 1];
                cell.b = data[idx + 2];

                cell.color = `rgb(${cell.r}, ${cell.g}, ${cell.b})`;
            }

            clusterCells();

            return true;
        };

        const renderCell = () => {
            ctx.clearRect(0, 0, content.clientWidth, content.clientHeight);

            ctx.font = `700 ${CELL_SIZE}px ${asciiFont}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            for (const { col, row, color, char } of cells) {
                ctx.fillStyle = color;

                ctx.fillText(
                    char,
                    col * CELL_STEP + CELL_SIZE / 2,
                    row * CELL_STEP + CELL_SIZE / 2
                );
            }

            renderOverlay();
        };

        const animate = (time) => {
            animationFrameId = 0;

            if (destroyed || !isAsciiActive) return;

            animationFrameId = requestAnimationFrame(animate);

            if (time - lastFrameTime < 1000 / FPS) return;

            lastFrameTime = time;

            if (!videoAnalysis()) return;

            renderCell();
        };

        const pauseAscii = () => {
            if (!isAsciiActive) return;

            isAsciiActive = false;

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = 0;
            }

            video.pause();
        };

        const resumeAscii = () => {
            if (destroyed) return;

            isAsciiActive = true;
            lastFrameTime = 0;

            video.play().catch(() => {});

            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        // gsap.fromTo(".Archive",{
        //     y:0,
        //     // scaleX:.95
        // },{
        //     y:0,
        //     scale:1,
        //     ease:"none",
        //     scrollTrigger: {
        //     trigger: ".Hero",
        //     start: "bottom bottom",
        //     end: () => `+=${window.innerHeight}px`,
        //     scrub: true, 
        //     }
        // })
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".Hero",
                start: "bottom bottom",
                end: () => `+=${window.innerHeight*.8}px`,
                scrub: true,
                pin:true,
                onUpdate: (self) => {
                    if (!isInitialized) return;

                    if (self.progress >= 1) {
                        gsap.delayedCall(.5, pauseAscii)
                    } else {
                        resumeAscii();
                    }
                },
            }
        })
        .fromTo(content,
            {clipPath: "inset(0 0 0 0)"},
            {clipPath: "inset(15% 25% 15% 25%)",ease: "power1.out"},
            0
        ).fromTo(".Hero__ascii-bg--1, .Hero__ascii-bg--2,.Hero__ascii-bg--3",
            {clipPath: "inset(0 0 0 0)"},
            {clipPath: "inset(15% 25% 15% 25%)",ease: "power1.out"},
            0
        )
        .fromTo(video, {
            filter: "brightness(1)",
        }, {
            filter: "brightness(0)",
            ease: "none",
        }, 0);

        const resizeObserver = new ResizeObserver(() => {
            setupCanvas();
            lastFrameTime = 0;
        });

        resizeObserver.observe(content);

        const start = async () => {
            await document.fonts.load(`700 ${CELL_SIZE}px ${asciiFont}`).catch(() => {});

            if (destroyed) return;

            setupCanvas();

            isInitialized = true;
            resumeAscii();
        };

        start();

        return () => {
            destroyed = true;
            isInitialized = false;
            isAsciiActive = false;

            cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;

            video.pause();

            resizeObserver.disconnect();

            tl.scrollTrigger?.kill();
            tl.kill();
        };
    }, [setupOverlay, renderOverlay]);

    return (
        <>
            <section className="Hero">
                <div className="Hero__ascii">

                    <div className="Hero__ascii-bg Hero__ascii-bg--1"></div>
                    <div className="Hero__ascii-bg Hero__ascii-bg--2"></div>
                    <div className="Hero__ascii-bg Hero__ascii-bg--3"></div>

                    <div className="ascii-effect" ref={contentRef}>
                            <video
                                className="ascii-effect__video"
                                ref={videoRef}
                                autoPlay
                                loop
                                muted
                                playsInline
                            >
                                <source src="/hero/video.mp4" type="video/mp4" />
                            </video>

                            <canvas
                                className="ascii-effect__canvas"
                                ref={canvasRef}
                            />

                            <canvas
                                className="ascii-effect__overlay"
                                ref={overlayRef}
                            />

                            <div className="Hero__content">
                                <div className="Hero__text">
                                    <h1><span>Dmytro Matiushenko</span> , creative developer & designer & freelancer</h1>
                                    <p>Designs and builds websites, products, and digital systems with a focus on clarity, performance, and usability.</p>
                                </div>
                            </div>
                    </div>
                </div>
            </section>
        </>
    );
}