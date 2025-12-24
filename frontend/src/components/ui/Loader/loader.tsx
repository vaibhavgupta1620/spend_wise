import { useEffect, useRef } from "react";
import * as THREE from "three";

const loader: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const textRef = useRef<HTMLParagraphElement | null>(null);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        const canvas = canvasRef.current;
        if (!canvas) return;

        /* ================= THREE SETUP ================= */
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x050508, 6, 22);

        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        camera.position.z = 10;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));

        /* ================= PARTICLES ================= */
        const count = isMobile ? 180 : 360;
        const geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(count * 3);
        const angles = new Float32Array(count);
        const radii = new Float32Array(count);
        const speeds = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            radii[i] = Math.random() * 6 + 1;
            angles[i] = Math.random() * Math.PI * 2;
            speeds[i] = Math.random() * (isMobile ? 0.002 : 0.003) + 0.001;

            positions[i * 3] = Math.cos(angles[i]) * radii[i];
            positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
            positions[i * 3 + 2] = Math.sin(angles[i]) * radii[i];
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xbabaff,
            size: isMobile ? 0.035 : 0.045,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        /* ================= RESIZE ================= */
        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", onResize);

        /* ================= ANIMATION ================= */
        const clock = new THREE.Clock();
        let frameId = 0;

        const animate = () => {
            const t = clock.getElapsedTime();
            const pos = geometry.attributes.position.array as Float32Array;

            for (let i = 0; i < count; i++) {
                angles[i] += speeds[i];
                pos[i * 3] = Math.cos(angles[i]) * radii[i];
                pos[i * 3 + 2] = Math.sin(angles[i]) * radii[i];
                pos[i * 3 + 1] += Math.sin(t + i) * (isMobile ? 0.001 : 0.002);
            }

            geometry.attributes.position.needsUpdate = true;
            particles.rotation.y += isMobile ? 0.0004 : 0.0007;
            particles.rotation.x += isMobile ? 0.0002 : 0.0004;

            renderer.render(scene, camera);
            frameId = requestAnimationFrame(animate);
        };

        animate();

        /* ================= LOADING TEXT ================= */
        const dots = [".", "..", "..."];
        let d = 0;

        const interval = window.setInterval(() => {
            if (textRef.current) {
                textRef.current.textContent = "Loading insights" + dots[d];
                d = (d + 1) % dots.length;
            }
        }, 700);

        /* ================= CLEANUP ================= */
        return () => {
            cancelAnimationFrame(frameId);
            clearInterval(interval);
            window.removeEventListener("resize", onResize);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-[#050508] overflow-hidden z-50">
            <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" />

            <div className="fixed inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <div className="flex gap-[0.06em] text-[clamp(2.2rem,7vw,5rem)] font-semibold tracking-[0.14em] uppercase">
                    {"Spendwise".split("").map((c, i) => (
                        <span
                            key={i}
                            style={{ animationDelay: `${i * 0.08}s` }}
                            className="opacity-0 translate-y-6 bg-gradient-to-r from-white via-[#bdbdff] to-[#7c7cff] bg-[length:300%] bg-clip-text text-transparent animate-letter animate-gradient"
                        >
                            {c}
                        </span>
                    ))}
                </div>

                <div className="mt-4 h-[2px] w-[120px] bg-gradient-to-r from-transparent via-[#8a8aff] to-transparent animate-underline" />

                <p
                    ref={textRef}
                    className="mt-4 text-sm tracking-widest text-white/60 animate-loaderFade"
                >
                    Loading insights
                </p>
            </div>
        </div>
    );
};

export default loader;
