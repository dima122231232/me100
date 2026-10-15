
"use client";

import { useCallback, useEffect, useRef } from "react";
let reg = 1.5;
const METEOR = {
    coreRadius: .8*reg,
    tailLength: 4*reg,
    tailWidth: 2*reg,
    tailAmount:4*reg,

    headLife: 0.1,
    trailLife: 0.1,
    fadePower: 0.1,
    tailIntensity: 10,
    sampleStep: 1,

    headColor: "#6503dc",
    trailColor: "#7f00ed",
    glowColor: "#7f00ed",
    headGlow: 1,
    trailGlow: 7,

    maxCells: 750,
};

export default function useMouseOverlay(contentRef, cellSize, cellStep) {
    const overlayRef = useRef(null);
    const gridRef = useRef({ cols: 0, rows: 0 });

    const cellsRef = useRef(new Map());
    const lastPointerRef = useRef(null);

    const animationFrameRef = useRef(0);
    const lastFrameTimeRef = useRef(0);

    const renderOverlay = useCallback(() => {
        const content = contentRef.current;
        const overlay = overlayRef.current;

        if (!content || !overlay) return;

        const ctx = overlay.getContext("2d");

        if (!ctx) return;

        ctx.clearRect(0, 0, content.clientWidth, content.clientHeight);

        ctx.save();

        for (const cell of cellsRef.current.values()) {
            const progress = Math.max(0, cell.life / cell.maxLife);
            const alpha = Math.min(
                1,
                cell.intensity * Math.pow(progress, METEOR.fadePower)
            );

            if (alpha < 0.01) continue;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = cell.isHead ? METEOR.headColor : METEOR.trailColor;
            ctx.shadowColor = METEOR.glowColor;
            ctx.shadowBlur = cell.isHead ? METEOR.headGlow : METEOR.trailGlow;

            ctx.fillRect(
                cell.col * cellStep,
                cell.row * cellStep,
                cellSize,
                cellSize
            );
        }

        ctx.restore();
    }, [contentRef, cellSize, cellStep]);

    const setupOverlay = useCallback((width, height, dpr, cols, rows) => {
        const overlay = overlayRef.current;

        if (!overlay) return;

        overlay.width = Math.round(width * dpr);
        overlay.height = Math.round(height * dpr);

        const ctx = overlay.getContext("2d");

        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        gridRef.current = { cols, rows };

        cellsRef.current.clear();
        lastPointerRef.current = null;

        renderOverlay();
    }, [renderOverlay]);

    useEffect(() => {
        const content = contentRef.current;

        if (!content) return;

        const addCell = (col, row, life, intensity, isHead = false) => {
            const { cols, rows } = gridRef.current;

            if (col < 0 || col >= cols || row < 0 || row >= rows) return;

            const cells = cellsRef.current;
            const key = `${col},${row}`;
            const existing = cells.get(key);

            if (!existing) {
                cells.set(key, {
                    col,
                    row,
                    life,
                    maxLife: life,
                    intensity,
                    isHead,
                });

                return;
            }

            if (life >= existing.life) {
                existing.life = life;
                existing.maxLife = life;
            }

            existing.intensity = Math.max(existing.intensity, intensity);
            existing.isHead = existing.isHead || isHead;
        };

        const spawnCircle = (x, y, radius, life, intensity, isHead = false) => {
            const centerCol = Math.round((x - cellSize / 2) / cellStep);
            const centerRow = Math.round((y - cellSize / 2) / cellStep);

            for (let row = Math.floor(centerRow - radius); row <= centerRow + radius; row++) {
                for (let col = Math.floor(centerCol - radius); col <= centerCol + radius; col++) {
                    const dx = col - centerCol;
                    const dy = row - centerRow;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance > radius) continue;

                    const falloff = 1 - Math.pow(distance / (radius + 0.35), 1.4) * 0.35;

                    addCell(col, row, life, intensity * falloff, isHead);
                }
            }
        };

        const spawnMeteor = (x, y, dirX, dirY, distance) => {
            spawnCircle(
                x,
                y,
                METEOR.coreRadius,
                METEOR.headLife,
                1,
                true
            );

            if (distance <= 0.1) return;

            const tailSteps = Math.max(1, Math.floor(METEOR.tailAmount));

            for (let i = 1; i <= tailSteps; i++) {
                const progress = i / tailSteps;
                const tailDistance = progress * METEOR.tailLength;
                const radius = METEOR.tailWidth * (1 - progress);

                const intensity = METEOR.tailIntensity * (
                    0.12 + 0.88 * Math.pow(1 - progress, 1.25)
                );

                const life = METEOR.trailLife * (
                    0.65 + 0.35 * (1 - progress)
                );

                spawnCircle(
                    x - dirX * tailDistance * cellStep,
                    y - dirY * tailDistance * cellStep,
                    radius,
                    life,
                    intensity
                );
            }
        };

        const animate = (time) => {
            animationFrameRef.current = 0;

            const dt = lastFrameTimeRef.current
                ? Math.min((time - lastFrameTimeRef.current) / 1000, 0.04)
                : 1 / 60;

            lastFrameTimeRef.current = time;

            const cells = cellsRef.current;

            for (const [key, cell] of cells) {
                cell.life -= dt;

                if (cell.life <= 0) {
                    cells.delete(key);
                }
            }

            renderOverlay();

            if (cells.size) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                lastFrameTimeRef.current = 0;
            }
        };

        const startAnimation = () => {
            if (animationFrameRef.current) return;

            lastFrameTimeRef.current = 0;
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        const handlePointerMove = (event) => {
            const rect = content.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const previous = lastPointerRef.current;

            const dx = previous ? x - previous.x : event.movementX || 0;
            const dy = previous ? y - previous.y : event.movementY || 0;
            const distance = Math.hypot(dx, dy);

            const dirX = distance > 0.01 ? dx / distance : 0;
            const dirY = distance > 0.01 ? dy / distance : 0;

            if (previous && distance > 0) {
                const steps = Math.min(
                    18,
                    Math.ceil(distance / (cellStep * METEOR.sampleStep))
                );

                for (let i = 1; i < steps; i++) {
                    const progress = i / steps;

                    spawnCircle(
                        previous.x + dx * progress,
                        previous.y + dy * progress,
                        0.8,
                        METEOR.trailLife * 0.42,
                        0.2 + progress * 0.1
                    );
                }
            }

            spawnMeteor(x, y, dirX, dirY, distance / cellStep);

            lastPointerRef.current = { x, y };

            const cells = cellsRef.current;

            while (cells.size > METEOR.maxCells) {
                cells.delete(cells.keys().next().value);
            }

            renderOverlay();
            startAnimation();
        };

        const handlePointerLeave = () => {
            lastPointerRef.current = null;
        };

        content.addEventListener("pointermove", handlePointerMove);
        content.addEventListener("pointerleave", handlePointerLeave);

        return () => {
            content.removeEventListener("pointermove", handlePointerMove);
            content.removeEventListener("pointerleave", handlePointerLeave);

            cancelAnimationFrame(animationFrameRef.current);

            animationFrameRef.current = 0;
            lastFrameTimeRef.current = 0;

            cellsRef.current.clear();
        };
    }, [contentRef, cellSize, cellStep, renderOverlay]);

    return {
        overlayRef,
        setupOverlay,
        renderOverlay,
    };
}
