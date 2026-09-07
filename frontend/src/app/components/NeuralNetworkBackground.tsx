import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * 神经网络节点背景（Neural Network Background）
 * 粒子节点 + 动态连线 + 鼠标视差，契合 AI 教学主题。
 * 蓝色调适配主主题，性能友好（~90 节点 + 距离阈值连线）。
 */
export function NeuralNetworkBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // --- 场景 / 相机 / 渲染器 ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // --- 节点圆形辉光贴图（避免方块粒子） ---
    const sprite = (() => {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext("2d")!;
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(37, 99, 235, 1)");
      g.addColorStop(0.4, "rgba(37, 99, 235, 0.6)");
      g.addColorStop(1, "rgba(37, 99, 235, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    })();

    // --- 节点数据 ---
    const NODE_COUNT = 90;
    const BOUNDS = { x: 5, y: 3.2, z: 1.6 };
    const positions = new Float32Array(NODE_COUNT * 3);
    const velocities = new Float32Array(NODE_COUNT * 3);

    for (let i = 0; i < NODE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2 * BOUNDS.x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2 * BOUNDS.y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2 * BOUNDS.z;
      velocities[i * 3] = (Math.random() - 0.5) * 0.006;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.006;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }

    const nodeGeom = new THREE.BufferGeometry();
    nodeGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const nodeMat = new THREE.PointsMaterial({
      size: 0.22,
      map: sprite,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const nodes = new THREE.Points(nodeGeom, nodeMat);
    scene.add(nodes);

    // --- 连线（LineSegments，每帧重建位置） ---
    const LINK_DIST = 1.7;
    const maxLinks = NODE_COUNT * 8; // 上限，避免数组爆
    const linePositions = new Float32Array(maxLinks * 6); // 每条线 2 点 × 3 分量
    const lineColors = new Float32Array(maxLinks * 6);

    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute("position", new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeom.setAttribute("color", new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeom.setDrawRange(0, 0);

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeom, lineMat);
    scene.add(lines);

    // --- 鼠标视差 ---
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouse.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);

    // --- 响应式 ---
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // --- 动画循环 ---
    let raf = 0;
    const colorA = new THREE.Color(0x2563eb); // 主蓝
    const colorB = new THREE.Color(0x0ea5e9); // 青蓝

    const animate = () => {
      raf = requestAnimationFrame(animate);

      // 节点漂移 + 边界反弹
      for (let i = 0; i < NODE_COUNT; i++) {
        const ix = i * 3;
        positions[ix] += velocities[ix];
        positions[ix + 1] += velocities[ix + 1];
        positions[ix + 2] += velocities[ix + 2];
        if (Math.abs(positions[ix]) > BOUNDS.x) velocities[ix] *= -1;
        if (Math.abs(positions[ix + 1]) > BOUNDS.y) velocities[ix + 1] *= -1;
        if (Math.abs(positions[ix + 2]) > BOUNDS.z) velocities[ix + 2] *= -1;
      }
      nodeGeom.attributes.position.needsUpdate = true;

      // 连线重建
      let li = 0; // 写入索引（点数）
      const d2 = LINK_DIST * LINK_DIST;
      for (let i = 0; i < NODE_COUNT; i++) {
        const ax = positions[i * 3], ay = positions[i * 3 + 1], az = positions[i * 3 + 2];
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const dx = ax - positions[j * 3];
          const dy = ay - positions[j * 3 + 1];
          const dz = az - positions[j * 3 + 2];
          const dist2 = dx * dx + dy * dy + dz * dz;
          if (dist2 < d2 && li + 6 <= linePositions.length) {
            const t = 1 - Math.sqrt(dist2) / LINK_DIST; // 越近越亮
            const c = colorA.clone().lerp(colorB, t);
            linePositions[li] = ax;
            linePositions[li + 1] = ay;
            linePositions[li + 2] = az;
            linePositions[li + 3] = positions[j * 3];
            linePositions[li + 4] = positions[j * 3 + 1];
            linePositions[li + 5] = positions[j * 3 + 2];
            lineColors[li] = c.r * t;
            lineColors[li + 1] = c.g * t;
            lineColors[li + 2] = c.b * t;
            lineColors[li + 3] = c.r * t;
            lineColors[li + 4] = c.g * t;
            lineColors[li + 5] = c.b * t;
            li += 6;
          }
        }
      }
      lineGeom.setDrawRange(0, li / 3); // 顶点数
      lineGeom.attributes.position.needsUpdate = true;
      lineGeom.attributes.color.needsUpdate = true;

      // 鼠标视差缓动
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      camera.position.x = mouse.x * 0.8;
      camera.position.y = -mouse.y * 0.5;
      camera.lookAt(0, 0, 0);

      // 整体缓慢自转
      nodes.rotation.z += 0.0006;
      lines.rotation.z += 0.0006;

      renderer.render(scene, camera);
    };
    animate();

    // --- 清理 ---
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      ro.disconnect();
      nodeGeom.dispose();
      lineGeom.dispose();
      nodeMat.dispose();
      lineMat.dispose();
      sprite.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />;
}
