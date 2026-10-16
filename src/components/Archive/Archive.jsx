
"use client";

import "./Archive.css";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Archive() {
    const canvasRef = useRef(null);

    const images = [
        'img/archive/1.jpg',
        'img/archive/2.jpg',
        'img/archive/3.jpg',
        'img/archive/4.jpg'
    ]

    useEffect(() => {
        const canvas = canvasRef.current;
        
        
        const renderer = new THREE.WebGLRenderer({ canvas });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setAnimationLoop(animate);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            canvas.clientWidth / canvas.clientHeight,
            .1,
            1000
        )

        const cube = new THREE.Mesh(new THREE.BoxGeometry(1,1,1) , new THREE.MeshBasicMaterial({color: 0x00ff00}));
        scene.add(cube);

        camera.position.z =5;

        function animate(){
            cube.rotation.x += .01;
            cube.rotation.z += .01;

            renderer.render(scene, camera);
        }

        window.addEventListener("resize", () => {
            const width = canvas.parentElement.clientWidth;
            const height = canvas.parentElement.clientHeight;

            renderer.setSize(width, height);

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        });

    }, []);

    return (
        <section className="Archive">
            <canvas ref={canvasRef}></canvas>
        </section>
    );
}
