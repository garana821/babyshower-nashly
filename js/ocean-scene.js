/**
 * Escena de fondo oceánica elegante y premium — Three.js
 * Genera texturas procedimentales para perlas nacaradas, burbujas de cristal iridiscentes,
 * caballitos de mar holográficos, estrellas de mar rosa-coral, medusas brillantes y corales blancos.
 * Todo se renderiza en 3D con capas de profundidad, movimiento fluido y paralaje del mouse/giroscopio.
 */
(function () {
  const canvas = document.getElementById("ocean-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 10;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // ---------- GENERACIÓN DE TEXTURAS PROCEDIMENTALES (Sin dependencias externas) ----------

  // 1. Textura de Perla Brillante
  function createPearlTexture() {
    const c = document.createElement("canvas");
    c.width = 64; c.height = 64;
    const ctx = c.getContext("2d");
    const grad = ctx.createRadialGradient(22, 22, 2, 32, 32, 28);
    grad.addColorStop(0, "#FFFFFF");
    grad.addColorStop(0.3, "#FFF5F7");
    grad.addColorStop(0.7, "#F8D8E5");
    grad.addColorStop(1, "#E8DFFB");

    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Brillo/Reflejo
    ctx.beginPath();
    ctx.arc(20, 20, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fill();
    return new THREE.CanvasTexture(c);
  }

  // 2. Textura de Burbuja Iridiscente
  function createBubbleTexture() {
    const c = document.createElement("canvas");
    c.width = 64; c.height = 64;
    const ctx = c.getContext("2d");
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);

    const grad = ctx.createRadialGradient(32, 32, 22, 32, 32, 28);
    grad.addColorStop(0, "rgba(255, 255, 255, 0)");
    grad.addColorStop(0.75, "rgba(189, 239, 239, 0.25)");
    grad.addColorStop(0.9, "rgba(248, 216, 229, 0.55)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0.85)");

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Reflejo en medialuna
    ctx.beginPath();
    ctx.arc(20, 20, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fill();
    return new THREE.CanvasTexture(c);
  }

  // 3. Textura de Estrella de Mar (Rosa-Coral)
  function createStarfishTexture() {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 128;
    const ctx = c.getContext("2d");
    
    // Gradiente rosa coral
    const grad = ctx.createRadialGradient(64, 64, 5, 64, 64, 50);
    grad.addColorStop(0, "#FFD3D7");
    grad.addColorStop(0.6, "#F8D8E5");
    grad.addColorStop(1, "#F9DCEB");

    ctx.fillStyle = grad;
    ctx.shadowColor = "rgba(248, 216, 229, 0.35)";
    ctx.shadowBlur = 10;

    // Dibujar estrella de 5 puntas redondeadas
    let spikes = 5, outerRadius = 45, innerRadius = 18;
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(64, 64 - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let x = 64 + Math.cos(rot) * outerRadius;
      let y = 64 + Math.sin(rot) * outerRadius;
      ctx.quadraticCurveTo(64 + Math.cos(rot - step/2)*innerRadius*1.5, 64 + Math.sin(rot - step/2)*innerRadius*1.5, x, y);
      rot += step;
      
      x = 64 + Math.cos(rot) * innerRadius;
      y = 64 + Math.sin(rot) * innerRadius;
      ctx.quadraticCurveTo(64 + Math.cos(rot - step/2)*outerRadius*0.9, 64 + Math.sin(rot - step/2)*outerRadius*0.9, x, y);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();

    // Pequeños puntitos perlados sobre la estrella
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.shadowBlur = 0;
    for (let i = 0; i < 5; i++) {
      let a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(64 + Math.cos(a) * 22, 64 + Math.sin(a) * 22, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  // 4. Textura de Caballito de Mar (Estilo Nacarado / Holográfico)
  function createSeahorseTexture() {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 256;
    const ctx = c.getContext("2d");

    const grad = ctx.createLinearGradient(0, 30, 0, 220);
    grad.addColorStop(0, "#F8D8E5"); // Rosa pastel
    grad.addColorStop(0.5, "#E8DFFB"); // Lavanda clara
    grad.addColorStop(1, "#9DE7E6"); // Turquesa pastel

    ctx.fillStyle = grad;
    ctx.beginPath();
    
    // Cabeza y corona
    ctx.arc(64, 50, 16, 0, Math.PI * 2);
    ctx.moveTo(64, 34);
    ctx.lineTo(74, 38);
    ctx.lineTo(69, 44);
    
    // Trompa elegante
    ctx.moveTo(50, 52);
    ctx.quadraticCurveTo(36, 52, 38, 59);
    ctx.quadraticCurveTo(46, 59, 50, 55);

    // Cuello y lomo ondulado
    ctx.moveTo(64, 66);
    ctx.quadraticCurveTo(76, 90, 72, 120);
    // Vientre
    ctx.quadraticCurveTo(54, 155, 64, 185);
    // Cola enrollada
    ctx.quadraticCurveTo(74, 205, 64, 225);
    ctx.quadraticCurveTo(52, 235, 52, 215);
    ctx.quadraticCurveTo(52, 200, 64, 200);
    ctx.quadraticCurveTo(70, 200, 64, 175);
    // Parte trasera vientre
    ctx.quadraticCurveTo(46, 145, 54, 100);
    ctx.quadraticCurveTo(52, 85, 64, 66);
    
    ctx.closePath();
    ctx.fill();

    // Aleta dorsal translúcida
    ctx.beginPath();
    ctx.moveTo(70, 95);
    ctx.quadraticCurveTo(88, 100, 74, 125);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fill();
    return new THREE.CanvasTexture(c);
  }

  // 5. Textura de Medusa Brillante (Jellyfish)
  function createJellyfishTexture() {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 256;
    const ctx = c.getContext("2d");

    const grad = ctx.createLinearGradient(0, 20, 0, 240);
    grad.addColorStop(0, "rgba(232, 223, 251, 0.85)"); // Lavanda
    grad.addColorStop(0.35, "rgba(248, 216, 229, 0.65)"); // Rosa pastel
    grad.addColorStop(0.8, "rgba(157, 231, 230, 0.2)"); // Celeste espuma
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");

    // Sombrero de cristal translúcido
    ctx.beginPath();
    ctx.arc(64, 55, 32, Math.PI, 0);
    ctx.quadraticCurveTo(96, 66, 64, 66);
    ctx.quadraticCurveTo(32, 66, 32, 55);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Tentáculos finos
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 5; i++) {
      let x = 44 + i * 10;
      ctx.beginPath();
      ctx.moveTo(x, 66);
      ctx.bezierCurveTo(x - 12, 120, x + 12, 170, x, 240);
      ctx.stroke();
    }
    return new THREE.CanvasTexture(c);
  }

  // 6. Textura de Corales Blancos
  function createCoralTexture() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 256;
    const ctx = c.getContext("2d");

    ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";

    // Función recursiva para dibujar ramas
    function drawCoralBranch(x, y, len, angle, w) {
      ctx.beginPath();
      ctx.save();
      ctx.lineWidth = w;
      ctx.translate(x, y);
      ctx.rotate(angle * Math.PI / 180);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -len);
      ctx.stroke();

      if (len < 18) {
        ctx.restore();
        return;
      }

      drawCoralBranch(0, -len, len * 0.72, angle - 25, w * 0.7);
      drawCoralBranch(0, -len, len * 0.72, angle + 25, w * 0.7);
      ctx.restore();
    }

    // Dibujar tallo coral
    drawCoralBranch(128, 256, 75, 0, 8);
    return new THREE.CanvasTexture(c);
  }

  // Instanciar texturas
  const tPearl = createPearlTexture();
  const tBubble = createBubbleTexture();
  const tStarfish = createStarfishTexture();
  const tSeahorse = createSeahorseTexture();
  const tJellyfish = createJellyfishTexture();
  const tCoral = createCoralTexture();

  // ---------- CREACIÓN Y DISTRIBUCIÓN DE ELEMENTOS EN CAPAS (Parallax y Profundidad) ----------

  // 1. Capa Primer Plano (Burbujas y Perlas subiendo constantemente)
  const fgItems = [];
  const fgGroup = new THREE.Group();
  scene.add(fgGroup);

  // Burbujas
  for (let i = 0; i < 70; i++) {
    const mat = new THREE.SpriteMaterial({ map: tBubble, transparent: true, opacity: 0.25 + Math.random() * 0.45 });
    const sp = new THREE.Sprite(mat);
    const size = 0.15 + Math.random() * 0.45;
    sp.scale.set(size, size, 1);
    sp.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, 2 + Math.random() * 3);
    sp.userData = { speed: 0.008 + Math.random() * 0.018, floatOffset: Math.random() * 100 };
    fgGroup.add(sp);
    fgItems.push(sp);
  }

  // Perlas
  for (let i = 0; i < 24; i++) {
    const mat = new THREE.SpriteMaterial({ map: tPearl, transparent: true, opacity: 0.35 + Math.random() * 0.5 });
    const sp = new THREE.Sprite(mat);
    const size = 0.12 + Math.random() * 0.25;
    sp.scale.set(size, size, 1);
    sp.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, 1 + Math.random() * 2);
    sp.userData = { speed: 0.006 + Math.random() * 0.012, floatOffset: Math.random() * 100 };
    fgGroup.add(sp);
    fgItems.push(sp);
  }

  // 2. Capa Segundo Plano (Criaturas marinas flotando con parallax medio)
  const mgGroup = new THREE.Group();
  scene.add(mgGroup);
  const mgItems = [];

  // Caballitos de mar
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.SpriteMaterial({ map: tSeahorse, transparent: true, opacity: 0.75 });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(0.6, 1.2, 1);
    sp.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, -1 - Math.random() * 2);
    sp.userData = { 
      bobSpeed: 0.8 + Math.random() * 0.8, 
      swaySpeed: 0.5 + Math.random() * 0.5,
      bobHeight: 0.15 + Math.random() * 0.2, 
      floatOffset: Math.random() * 100 
    };
    mgGroup.add(sp);
    mgItems.push(sp);
  }

  // Medusas (Jellyfish)
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.SpriteMaterial({ map: tJellyfish, transparent: true, opacity: 0.65 });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(0.7, 1.4, 1);
    sp.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 7 - 2, -2 - Math.random() * 2);
    sp.userData = { 
      bobSpeed: 0.4 + Math.random() * 0.5, 
      bobHeight: 0.25 + Math.random() * 0.35, 
      floatOffset: Math.random() * 100 
    };
    mgGroup.add(sp);
    mgItems.push(sp);
  }

  // Estrellas de mar
  for (let i = 0; i < 5; i++) {
    const mat = new THREE.SpriteMaterial({ map: tStarfish, transparent: true, opacity: 0.8 });
    const sp = new THREE.Sprite(mat);
    const size = 0.35 + Math.random() * 0.25;
    sp.scale.set(size, size, 1);
    sp.position.set((Math.random() - 0.5) * 11, (Math.random() - 0.5) * 6, -1 - Math.random() * 2);
    sp.userData = { 
      rotSpeed: (Math.random() - 0.5) * 0.005, 
      bobSpeed: 0.3 + Math.random() * 0.4, 
      bobHeight: 0.08, 
      floatOffset: Math.random() * 100 
    };
    mgGroup.add(sp);
    mgItems.push(sp);
  }

  // Corales Blancos en el fondo de la vista (anclados abajo)
  const coralGroup = new THREE.Group();
  scene.add(coralGroup);
  const corals = [];
  for (let i = 0; i < 6; i++) {
    const mat = new THREE.SpriteMaterial({ map: tCoral, transparent: true, opacity: 0.55 });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(2.2, 2.2, 1);
    // Distribuir a lo largo de la base horizontal
    sp.position.set(-6 + (i * 2.4) + (Math.random() - 0.5) * 0.6, -4.5 + Math.random() * 0.3, -4 - Math.random() * 2);
    sp.userData = { swaySpeed: 0.2 + Math.random() * 0.3, swayMax: 0.04 + Math.random() * 0.04, floatOffset: Math.random() * 100 };
    coralGroup.add(sp);
    corals.push(sp);
  }

  // ---------- ILUMINACIÓN SUAVE ----------
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
  scene.add(ambientLight);

  // ---------- CONTROL DE PARALLAX CON MOUSE / GIROSCOPIO ----------
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  window.addEventListener("mousemove", (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma === null) return;
    targetX = Math.max(-1, Math.min(1, e.gamma / 25));
    targetY = Math.max(-1, Math.min(1, (e.beta - 40) / 25));
  });

  // ---------- AUMENTAR VELOCIDAD DE BURBUJAS (Easter Egg y Confirmación RSVP) ----------
  let bubbleBoost = 1.0;
  window.increaseBubbles = function() {
    bubbleBoost = 5.0;
    // Disminuir gradualmente a la velocidad normal en 5 segundos
    gsap.to({ value: 5.0 }, {
      value: 1.0,
      duration: 4.8,
      ease: "power1.out",
      onUpdate: function() {
        bubbleBoost = this.targets()[0].value;
      }
    });
  };

  // ---------- LOOP DE RENDERIZACIÓN Y ANIMACIÓN ----------
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // 1. Animar Burbujas y Perlas (Subida constante)
    fgItems.forEach(sp => {
      sp.position.y += sp.userData.speed * bubbleBoost;
      // Movimiento ondulante horizontal
      sp.position.x += Math.sin(time + sp.userData.floatOffset) * 0.002;
      
      // Reciclado cuando superan la pantalla
      if (sp.position.y > 6.5) {
        sp.position.y = -6.5;
        sp.position.x = (Math.random() - 0.5) * 16;
      }
    });

    // 2. Animar Criaturas del Segundo Plano
    mgItems.forEach(sp => {
      // Bobbing vertical
      sp.position.y += Math.sin(time * sp.userData.bobSpeed + sp.userData.floatOffset) * (sp.userData.bobHeight * 0.015);
      
      if (sp.userData.swaySpeed) {
        // Balanceo horizontal
        sp.position.x += Math.cos(time * sp.userData.swaySpeed + sp.userData.floatOffset) * 0.005;
      }
      
      if (sp.userData.rotSpeed) {
        // Rotación lenta de estrellas de mar
        sp.rotation += sp.userData.rotSpeed;
      }
    });

    // 3. Animar Balanceo de Corales Blancos
    corals.forEach(sp => {
      sp.rotation = Math.sin(time * sp.userData.swaySpeed + sp.userData.floatOffset) * sp.userData.swayMax;
    });

    // 4. Parallax de la Cámara
    currentX += (targetX - currentX) * 0.05;
    currentY += (targetY - currentY) * 0.05;

    // Diferente intensidad de traslación para simular múltiples capas 3D
    fgGroup.position.x = -currentX * 0.4;
    fgGroup.position.y = currentY * 0.3;

    mgGroup.position.x = -currentX * 0.15;
    mgGroup.position.y = currentY * 0.1;

    coralGroup.position.x = -currentX * 0.06;
    coralGroup.position.y = currentY * 0.03;

    renderer.render(scene, camera);
  }

  animate();

  // ---------- RESPONSIVIDAD ----------
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
