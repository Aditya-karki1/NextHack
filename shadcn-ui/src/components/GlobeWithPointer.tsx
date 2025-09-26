"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";

const GlobeWithPointer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvas3DRef = useRef<HTMLCanvasElement>(null);
  const canvas2DRef = useRef<HTMLCanvasElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !canvas3DRef.current || !canvas2DRef.current || !popupRef.current) return;

    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.OrthographicCamera;
    let rayCaster: THREE.Raycaster;
    let controls: OrbitControls;
    let globe: THREE.Points;
    let globeMesh: THREE.Mesh;
    let pointer: THREE.Mesh;
    let earthTexture: THREE.Texture;
    let mapMaterial: THREE.ShaderMaterial;
    let popupOpenTl: gsap.core.Timeline;
    let popupCloseTl: gsap.core.Timeline;
    let pointerPos: THREE.Vector3;
    let clock = new THREE.Clock();
    let dragged = false;
    let mouse = new THREE.Vector2(-1, -1);

    // Shaders
    const vertexShader = `
      uniform sampler2D u_map_tex;
      uniform float u_dot_size;
      uniform float u_time_since_click;
      uniform vec3 u_pointer;
      #define PI 3.14159265359
      varying float vOpacity;
      varying vec2 vUv;
      void main() {
          vUv = uv;
          float visibility = step(.2, texture2D(u_map_tex, uv).r);
          gl_PointSize = visibility * u_dot_size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vOpacity = (1. / length(mvPosition.xyz) - .7);
          vOpacity = clamp(vOpacity, .03, 1.);
          float t = u_time_since_click - .1;
          t = max(0., t);
          float max_amp = .15;
          float dist = 1. - .5 * length(position - u_pointer);
          float damping = 1. / (1. + 20. * t);
          float delta = max_amp * damping * sin(5. * t * (1. + 2. * dist) - PI);
          delta *= 1. - smoothstep(.8, 1., dist);
          vec3 pos = position;
          pos *= (1. + delta);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
      }
    `;

    const fragmentShader = `
      uniform sampler2D u_map_tex;
      varying float vOpacity;
      varying vec2 vUv;
      void main() {
          vec3 color = texture2D(u_map_tex, vUv).rgb;
          color -= .2 * length(gl_PointCoord.xy - vec2(.5));
          float dot = 1. - smoothstep(.38, .4, length(gl_PointCoord.xy - vec2(.5)));
          if (dot < 0.5) discard;
          gl_FragColor = vec4(color, dot * vOpacity);
      }
    `;

    // Init
    function initScene() {
      renderer = new THREE.WebGLRenderer({ canvas: canvas3DRef.current!, alpha: false }); // remove alpha so background is black
      renderer.setClearColor(0x000000, 1); // set background black
      renderer.setPixelRatio(window.devicePixelRatio);
      scene = new THREE.Scene();

      camera = new THREE.OrthographicCamera(-1.1, 1.1, 1.1, -1.1, 0, 3);
      camera.position.z = 1.1;

      rayCaster = new THREE.Raycaster();
      rayCaster.far = 1.15;

      controls = new OrbitControls(camera, canvas3DRef.current!);
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.enableDamping = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5; // smooth rotation
      controls.minPolarAngle = 0.4 * Math.PI;
      controls.maxPolarAngle = 0.4 * Math.PI;

      let timestamp: number;
      controls.addEventListener("start", () => (timestamp = Date.now()));
      controls.addEventListener("end", () => (dragged = Date.now() - timestamp > 600));

      new THREE.TextureLoader().load("https://ksenia-k.com/img/earth-map-colored.png", (mapTex) => {
        earthTexture = mapTex;
        earthTexture.repeat.set(1, 1);
        createGlobe();
        createPointer();
        createPopupTimelines();
        addCanvasEvents();
        updateSize();
        render();
      });
    }

    function createGlobe() {
      const globeGeometry = new THREE.IcosahedronGeometry(1, 22);
      mapMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          u_map_tex: { value: earthTexture },
          u_dot_size: { value: 0 },
          u_pointer: { value: new THREE.Vector3(0, 0, 1) },
          u_time_since_click: { value: 0 },
        },
        transparent: true,
      });

      globe = new THREE.Points(globeGeometry, mapMaterial);
      scene.add(globe);

      globeMesh = new THREE.Mesh(
        globeGeometry,
        new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.05 })
      );
      scene.add(globeMesh);
    }

    function createPointer() {
      const geometry = new THREE.SphereGeometry(0.04, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
      pointer = new THREE.Mesh(geometry, material);
      scene.add(pointer);
    }

    function addCanvasEvents() {
      containerRef.current!.addEventListener("mousemove", (e) => updateMousePosition(e.clientX, e.clientY));
      containerRef.current!.addEventListener("click", (e) => {
        if (!dragged) {
          updateMousePosition(e.clientX, e.clientY);
          const res = checkIntersects();
          if (res.length) {
            pointerPos = res[0].face!.normal.clone();
            pointer.position.copy(res[0].face!.normal);
            mapMaterial.uniforms.u_pointer.value = res[0].face!.normal;
            popupRef.current!.innerHTML = cartesianToLatLong();
            showPopupAnimation(true);
            clock.start();
          }
        }
      });
    }

    function updateMousePosition(eX: number, eY: number) {
      mouse.x = (eX - containerRef.current!.offsetLeft) / containerRef.current!.offsetWidth * 2 - 1;
      mouse.y = -((eY - containerRef.current!.offsetTop) / containerRef.current!.offsetHeight) * 2 + 1;
    }

    function checkIntersects() {
      rayCaster.setFromCamera(mouse, camera);
      const intersects = rayCaster.intersectObject(globeMesh);
      document.body.style.cursor = intersects.length ? "pointer" : "auto";
      return intersects;
    }

    function cartesianToLatLong() {
      const pos = pointer.position;
      const lat = 90 - Math.acos(pos.y) * 180 / Math.PI;
      const lng = (270 + Math.atan2(pos.x, pos.z) * 180 / Math.PI) % 360 - 180;
      return `${lat.toFixed(2)}° N, ${lng.toFixed(2)}° E`;
    }

    function createPopupTimelines() {
      popupOpenTl = gsap.timeline({ paused: true })
        .to(pointer.material, { duration: 0.2, opacity: 1 }, 0)
        .fromTo(canvas2DRef.current!, { opacity: 0 }, { duration: 0.3, opacity: 1 }, 0.15)
        .fromTo(popupRef.current!, { opacity: 0, scale: 0.9 }, { duration: 0.1, opacity: 1, scale: 1 }, 0.25);

      popupCloseTl = gsap.timeline({ paused: true })
        .to(pointer.material, { duration: 0.3, opacity: 0.2 }, 0)
        .to(canvas2DRef.current!, { duration: 0.3, opacity: 0 }, 0)
        .to(popupRef.current!, { duration: 0.3, opacity: 0, scale: 0.9 }, 0);
    }

    function showPopupAnimation(lifted: boolean) {
      if (lifted) {
        const positionLifted = pointer.position.clone().multiplyScalar(1.3);
        gsap.from(pointer.position, { duration: 0.25, x: positionLifted.x, y: positionLifted.y, z: positionLifted.z, ease: "power3.out" });
      }
      popupCloseTl.pause(0);
      popupOpenTl.play(0);
    }

    function updateSize() {
      const minSide = 0.65 * Math.min(window.innerWidth, window.innerHeight);
      containerRef.current!.style.width = minSide + "px";
      containerRef.current!.style.height = minSide + "px";
      renderer.setSize(minSide, minSide);
      canvas2DRef.current!.width = canvas2DRef.current!.height = minSide;
      mapMaterial.uniforms.u_dot_size.value = 0.04 * minSide;
    }

    function render() {
      mapMaterial.uniforms.u_time_since_click.value = clock.getElapsedTime();
      checkIntersects();
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    window.addEventListener("resize", updateSize);
    initScene();

    return () => {
      window.removeEventListener("resize", updateSize);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex justify-center items-center z-0 bg-black"
    >
      <canvas ref={canvas3DRef} className="absolute" />
      <canvas ref={canvas2DRef} className="absolute pointer-events-none" />
      <div ref={popupRef} className="absolute bg-black text-white p-2 rounded text-sm opacity-0" />
    </div>
  );
};

export default GlobeWithPointer;
