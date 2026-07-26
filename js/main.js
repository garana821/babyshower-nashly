/**
 * Baby Shower "Bajo las Olas" — lógica principal del front-end.
 * Sin build step: pensado para abrirse directamente o servirse por Express.
 */
(function () {
  "use strict";

  const API_BASE = "/api";
  const EVENT_DATE = new Date("2026-10-10T16:00:00-04:00");

  let ambientAudio = null;
  let audioOn = false;

  /* ============================================================
     0. Utilidades
     ============================================================ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ============================================================
     1. CURSOR PERSONALIZADO (perla con rastro)
     ============================================================ */
  const cursorPearl = $("#cursor-pearl");
  const cursorTrail = $("#cursor-trail");
  let cursorEnabled = !("ontouchstart" in window);

  let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
  let trailX = mouseX, trailY = mouseY;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (cursorEnabled) {
      cursorPearl.style.left = mouseX + "px";
      cursorPearl.style.top = mouseY + "px";
    }
  });

  (function trailLoop() {
    trailX += (mouseX - trailX) * 0.18;
    trailY += (mouseY - trailY) * 0.18;
    if (cursorEnabled) {
      cursorTrail.style.left = trailX + "px";
      cursorTrail.style.top = trailY + "px";
    }
    requestAnimationFrame(trailLoop);
  })();

  $$("a, button, .attend-opt, .floater, .gallery-item, input, select, textarea").forEach((el) => {
    el.addEventListener("mouseenter", () => cursorPearl.classList.add("hovering"));
    el.addEventListener("mouseleave", () => cursorPearl.classList.remove("hovering"));
  });

  $("#cursorToggle").addEventListener("click", () => {
    cursorEnabled = !cursorEnabled;
    document.body.classList.toggle("no-custom-cursor", !cursorEnabled);
    cursorPearl.style.opacity = cursorEnabled ? "1" : "0";
    cursorTrail.style.opacity = cursorEnabled ? "1" : "0";
  });

  if (!cursorEnabled) document.body.classList.add("no-custom-cursor");

  /* ============================================================
     2. INTRO INTERACTIVA — VUELO DE AVION DE PAPEL
     ============================================================ */
  const intro = $("#intro");

  function closeIntro() {
    document.body.classList.remove("intro-active");
    animateHero();
    startScrollReveals();
    gsap.to(intro, {
      opacity: 0,
      duration: 1.2,
      ease: "power2.out",
      onComplete: () => {
        intro.style.display = "none";
        document.body.style.overflow = "";
        $("#topbar").classList.add("visible");
        startAmbientAudioIfEnabled();
      }
    });
  }

  function initAudio() {
    try {
      if (!ambientAudio) {
        ambientAudio = new Audio("assets/music/baby-nashly.mp3");
        ambientAudio.loop = true;
        ambientAudio.volume = 0.45;
      }
      audioOn = true;
      $("#audioToggle").classList.add("hovering");
      $("#audioToggle").style.background = "rgba(255,198,212,.9)";
      ambientAudio.play().catch(e => console.log("Audio play blocked:", e));
    } catch (e) { }
  }

  // Animación del avión y revelaciones
  (function runIntroAnimation() {
    if (window.MotionPathPlugin) {
      gsap.registerPlugin(MotionPathPlugin);
    }

    const trail = $("#trailPath");
    const plane = $("#plane");

    if (trail && plane) {
      const trailLength = trail.getTotalLength();
      trail.style.strokeDasharray = trailLength;
      trail.style.strokeDashoffset = trailLength;

      // Escala inicial del avión
      gsap.set(plane, { scale: 1.15, transformOrigin: "50% 50%" });

      // Estado inicial de los textos originales
      gsap.set(".wave-text span", { opacity: 0, y: 24 });
      gsap.set("#babyShowerTitle", { opacity: 0, y: 15 });
      gsap.set("#babyShowerSub", { opacity: 0, y: 15 });
      gsap.set("#introStartBtn", { opacity: 0, y: 15 });

      // Tramo de duración
      const seg1 = 4.2;  // entrada + loop 1
      const seg2 = 3.6;  // loop 2
      const seg3 = 3.6;  // loop 3
      const seg4 = 2.8;  // salida
      const totalDuration = seg1 + seg2 + seg3 + seg4;

      const t1 = 0;
      const t2 = t1 + seg1;
      const t3 = t2 + seg2;
      const t4 = t3 + seg3;
      const tEnd = t4 + seg4;

      const tl = gsap.timeline({ defaults: { ease: "power1.inOut" } });

      function flySegment(startPct, endPct, duration, atTime) {
        tl.to(plane, {
          duration,
          ease: "power1.inOut",
          motionPath: {
            path: trail,
            start: startPct,
            end: endPct,
            align: trail,
            alignOrigin: [0.5, 0.5],
            autoRotate: 90
          }
        }, atTime);
      }

      // Vuelo segmentado
      flySegment(0, 0.30, seg1, t1);
      flySegment(0.30, 0.58, seg2, t2);
      flySegment(0.58, 0.85, seg3, t3);
      flySegment(0.85, 1.00, seg4, t4);

      // Estela
      tl.to(trail, { strokeDashoffset: 0, duration: totalDuration, ease: "none" }, 0);

      // Efecto aleteo/flourish
      function flourish(atTime) {
        tl.to(plane, { scale: "+=0.18", duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" }, atTime);
      }
      flourish(t2 - 0.3);
      flourish(t3 - 0.3);
      flourish(t4 - 0.3);

      // Revelación 1: Nombre "Nashly Antonella" (waving spans)
      tl.to(".wave-text span", {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.045,
        ease: "back.out(1.6)"
      }, t2 - 0.2);

      // Revelación 2: Título "Baby Shower"
      tl.to("#babyShowerTitle", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out"
      }, t3 - 0.2);

      // Revelación 3: Subtítulo "Una pequeña sirenita está por llegar"
      tl.to("#babyShowerSub", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out"
      }, t4 - 0.2);

      // Cierre del avión, estela y entrada del botón original
      tl.to(trail, { opacity: 0, duration: 1 }, tEnd - 0.6);
      tl.to(plane, { opacity: 0, duration: 0.8 }, tEnd - 0.5);
      tl.to("#introStartBtn", {
        opacity: 1,
        pointerEvents: "auto",
        y: 0,
        duration: 0.8,
        ease: "power2.out"
      }, tEnd - 0.2);

      // Eventos
      $("#introStartBtn").addEventListener("click", () => {
        initAudio();
        closeIntro();
      });

      $("#skipBtn").addEventListener("click", () => {
        tl.progress(1);
        initAudio();
        closeIntro();
      });
    }
  })();

  document.body.style.overflow = "hidden";

  /* ============================================================
     3. AUDIO AMBIENTAL (assets/music/baby-nashly.mp3)
     ============================================================ */
  function playExplosionSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(900 + i * 200 + Math.random() * 80, now + i * 0.06);

        gain.gain.setValueAtTime(0, now + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.04, now + i * 0.06 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.5);
      }
    } catch (e) {}
  }

  function startAmbientAudioIfEnabled() {
    if (audioOn && ambientAudio && ambientAudio.paused) {
      ambientAudio.play().catch(() => {});
    }
  }

  $("#audioToggle").addEventListener("click", function () {
    audioOn = !audioOn;
    this.classList.toggle("hovering", audioOn);
    this.style.background = audioOn ? "rgba(255,198,212,.9)" : "";
    if (audioOn) {
      if (!ambientAudio) {
        ambientAudio = new Audio("assets/music/baby-nashly.mp3");
        ambientAudio.loop = true;
        ambientAudio.volume = 0.45;
      }
      ambientAudio.play().catch(() => {});
    } else {
      if (ambientAudio) {
        ambientAudio.pause();
      }
    }
  });

  /* ============================================================
     4. MASCOTA — Caballito guía por secciones
     ============================================================ */
  const mascot = $("#mascot");
  const mascotBubble = $("#mascotBubble");
  const mascotMessages = {
    hero: "¡Hola! Soy Nash, tu guía. Desliza para explorar la invitación 🌊",
    story: "Aquí te contamos cómo empezó todo esta bonita espera 🐚",
    details: "No olvides la fecha, ¡nos vemos bajo las olas! 📍",
    countdown: "El tiempo corre... ¡cada segundo nos acerca más! ⏳",
    agenda: "Así se sentirá la tarde, minuto a minuto 🎈",
    gallery: "Estas fotitos flotan como recuerdos bajo el mar 📸",
    rsvp: "Cuéntanos si nos acompañarás, ¡nos haría muy felices! 💌",
    gifts: "Aquí unas ideas si deseas traer un detalle 🎁"
  };

  let mascotTimer = null;
  function showMascotMessage(key) {
    if (!mascotMessages[key]) return;
    mascotBubble.textContent = mascotMessages[key];
    mascot.classList.add("talking");
    clearTimeout(mascotTimer);
    mascotTimer = setTimeout(() => mascot.classList.remove("talking"), 3600);
  }
  mascot.addEventListener("click", () => showMascotMessage(currentSection || "hero"));

  /* ============================================================
     5. SCROLL: reveals, hilo de perlas, mascota por sección
     ============================================================ */
  const revealEls = $$(".reveal");
  const sections = $$("section[id], header[id]");
  let currentSection = "hero";

  function animateHero() {
    if (typeof gsap === "undefined") return;

    // Configurar estados iniciales del Hero
    gsap.set(".hero .eyebrow", { y: 25, opacity: 0 });
    gsap.set(".hero-title", { y: 35, opacity: 0, scale: 0.96 });
    gsap.set(".hero-subtitle-top", { y: 20, opacity: 0 });
    gsap.set(".hero-sub", { y: 20, opacity: 0 });
    gsap.set(".hero-date-chip", { y: 30, opacity: 0, scale: 0.95 });
    gsap.set(".hero-scroll", { y: 15, opacity: 0 });
    gsap.set(".hero .floater img, .hero .floater svg", { scale: 0.6, y: 30, opacity: 0 });

    // Animación secuencial
    const heroTl = gsap.timeline({ delay: 0.3 });
    heroTl.to(".hero .eyebrow", { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" })
          .to(".hero-title", { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: "power3.out" }, "-=0.7")
          .to(".hero-subtitle-top", { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, "-=0.7")
          .to(".hero-sub", { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, "-=0.7")
          .to(".hero-date-chip", { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "back.out(1.2)" }, "-=0.5")
          .to(".hero-scroll", { y: 0, opacity: 1, duration: 0.8 }, "-=0.3")
          .to(".hero .floater img, .hero .floater svg", { scale: 1, opacity: 1, y: 0, duration: 1.1, stagger: 0.15, ease: "back.out(1.4)" }, "-=0.8");
  }

  let scrollObserverInitialized = false;
  function startScrollReveals() {
    if (scrollObserverInitialized) return;
    scrollObserverInitialized = true;

    // Registrar ScrollTrigger si está disponible
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);

      // Animar cada elemento .reveal con ScrollTrigger
      revealEls.forEach((section) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 88%", // se activa cuando la parte superior de la sección está al 88% del viewport
            toggleActions: "play none none none"
          }
        });

        // 1. Animar la sección en sí
        tl.to(section, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out"
        });

        // 2. Si tiene una cabecera de sección (.section-head), animar sus elementos
        const head = $(".section-head", section);
        if (head) {
          const eyebrow = $(".eyebrow", head);
          const h2 = $("h2", head);
          const p = $("p", head);
          const elementsToAnimate = [];
          if (eyebrow) elementsToAnimate.push(eyebrow);
          if (h2) elementsToAnimate.push(h2);
          if (p) elementsToAnimate.push(p);

          if (elementsToAnimate.length > 0) {
            gsap.set(elementsToAnimate, { y: 20, opacity: 0 });
            tl.to(elementsToAnimate, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.15,
              ease: "power2.out"
            }, "-=0.7");
          }
        }

        // 3. Animar la tarjeta de historia (si la hay)
        const storyCard = $(".story-card", section);
        if (storyCard) {
          gsap.set(storyCard, { y: 30, opacity: 0 });
          tl.to(storyCard, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power2.out"
          }, "-=0.6");
        }

        // 4. Animar elementos escalonados (stagger) como cuadrículas o listas
        const staggerContainer = $(".reveal-stagger", section);
        if (staggerContainer) {
          const items = Array.from(staggerContainer.children);
          if (items.length > 0) {
            gsap.set(items, { y: 30, opacity: 0 });
            tl.to(items, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.15,
              ease: "power3.out"
            }, "-=0.6");
          }
        }

        // 5. Animar la tarjeta RSVP (si la hay)
        const rsvpCard = $(".rsvp-card", section);
        if (rsvpCard) {
          gsap.set(rsvpCard, { y: 40, opacity: 0, scale: 0.98 });
          tl.to(rsvpCard, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            ease: "power3.out"
          }, "-=0.6");
        }

        // 6. Animar elementos flotantes de la sección (floater)
        const floaters = $$(".floater img, .floater svg", section);
        if (floaters.length > 0) {
          gsap.set(floaters, { scale: 0.6, y: 30, opacity: 0 });
          tl.to(floaters, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.15,
            ease: "back.out(1.4)"
          }, "-=0.6");
        }
      });
    } else {
      // Fallback simple por si falla GSAP
      revealEls.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    }
  }

  if (!document.body.classList.contains("intro-active")) {
    animateHero();
    startScrollReveals();
  }

  const sectionIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
          currentSection = entry.target.id;
          showMascotMessage(currentSection);
        }
      });
    },
    { threshold: [0.4, 0.6] }
  );
  sections.forEach((s) => sectionIO.observe(s));

  const threadFill = $("#threadFill");
  const threadPearl = $("#threadPearl");
  const topbar = $("#topbar");

  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight <= 0 ? 0 : Math.min(1, Math.max(0, scrollTop / docHeight));
    const y = progress * 200;
    threadFill.setAttribute("d", `M12 0 L12 ${y}`);
    threadPearl.setAttribute("cy", y);

    if (scrollTop > 40) topbar.classList.add("visible");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============================================================
     6. PARALLAX SUAVE (mousemove) en floaters
     ============================================================ */
  const floaters = $$(".floater");
  window.addEventListener("mousemove", (e) => {
    const px = (e.clientX / innerWidth - 0.5) * 2;
    const py = (e.clientY / innerHeight - 0.5) * 2;
    floaters.forEach((f, i) => {
      const depth = (i % 3) + 1;
      f.style.transform = `translate(${px * depth * 6}px, ${py * depth * 6}px)`;
    });
  });

  /* ============================================================
     7. CICLO DÍA / NOCHE según hora local del visitante
     ============================================================ */
  const tint = $("#dayNightTint");
  function applyDayNightTint() {
    if (!tint) return;
    const h = new Date().getHours();
    let gradient;
    if (h >= 6 && h < 11) {
      gradient = "linear-gradient(180deg, rgba(255,244,214,.25), transparent 60%)"; // mañana
    } else if (h >= 11 && h < 17) {
      gradient = "linear-gradient(180deg, rgba(255,255,255,0), transparent)"; // mediodía claro
    } else if (h >= 17 && h < 20) {
      gradient = "linear-gradient(180deg, rgba(255,178,150,.28), transparent 60%)"; // atardecer
    } else {
      gradient = "linear-gradient(180deg, rgba(90,80,150,.22), rgba(40,40,90,.12))"; // noche
    }
    tint.style.background = gradient;
  }
  applyDayNightTint();
  setInterval(applyDayNightTint, 10 * 60 * 1000);

  /* ============================================================
     8. COUNTDOWN
     ============================================================ */
  function updateCountdown() {
    const now = new Date();
    let diff = Math.max(0, EVENT_DATE - now);
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    $("#cd-days").textContent = String(days).padStart(2, "0");
    $("#cd-hours").textContent = String(hours).padStart(2, "0");
    $("#cd-minutes").textContent = String(minutes).padStart(2, "0");
    $("#cd-seconds").textContent = String(seconds).padStart(2, "0");
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ============================================================
     9. GALERÍA — tarjetas placeholder listas para reemplazar
     ============================================================ */
  const galleryGrid = $("#galleryGrid");
  const galleryIcons = ["🐚", "⭐", "🫧", "🦀"];
  galleryIcons.forEach((icon, i) => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.style.setProperty("--i", i);
    item.innerHTML = `<img src="assets/images/foto-${i + 1}.jpeg" alt="Momento ${i + 1}" loading="lazy">`;
    galleryGrid.appendChild(item);
  });

  /* ============================================================
     10. RSVP — formulario, validación, envío a la API, confetti
     ============================================================ */
  const attendToggle = $("#attendToggle");
  $$(".attend-opt", attendToggle).forEach((opt) => {
    opt.addEventListener("click", () => {
      $$(".attend-opt", attendToggle).forEach((o) => o.classList.remove("active"));
      opt.classList.add("active");
      $("input", opt).checked = true;
    });
  });

  const rsvpForm = $("#rsvpForm");
  const formError = $("#formError");
  const successBlock = $("#rsvp-success");
  const successMsg = $("#successMsg");

  rsvpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const firstName = $("#firstName").value.trim();
    if (!firstName) {
      formError.classList.add("show");
      $("#firstName").focus();
      return;
    }
    formError.classList.remove("show");

    const payload = {
      firstName,
      lastName: $("#lastName").value.trim(),
      phone: $("#phone").value.trim(),
      attendees: Number($("#attendees").value),
      status: rsvpForm.querySelector('input[name="status"]:checked').value,
      message: $("#message").value.trim()
    };

    const submitBtn = rsvpForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    try {
      const res = await fetch(`${API_BASE}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("request failed");
    } catch (err) {
      // Si no hay backend corriendo (ej. abierto como archivo local), igual
      // mostramos la confirmación visual y guardamos localmente como respaldo.
      try {
        const backup = JSON.parse(localStorage.getItem("rsvp_backup") || "[]");
        backup.push({ ...payload, createdAt: new Date().toISOString() });
        localStorage.setItem("rsvp_backup", JSON.stringify(backup));
      } catch (_) { }
    }

    rsvpForm.style.display = "none";
    successBlock.classList.add("show");

    // Animar la burbuja mágica de éxito y la mascota
    gsap.fromTo("#successBigBubble", { scale: 0, y: 50 }, { scale: 1, y: 0, duration: 0.8, ease: "back.out(1.5)" });
    gsap.to("#successMascot", { scale: 1, opacity: 1, duration: 0.6, delay: 0.6, ease: "back.out(1.7)" });

    // Programar la explosión de la burbuja y el salto de la mascota
    gsap.to("#successBigBubble", {
      scale: 0,
      opacity: 0,
      duration: 0.25,
      delay: 1.4,
      ease: "power2.in",
      onComplete: () => {
        playPopEffect();
      }
    });

    gsap.to("#successMascot", {
      rotation: 360,
      y: -28,
      scale: 1.25,
      duration: 0.8,
      delay: 1.4,
      ease: "power2.out",
      onComplete: () => {
        gsap.to("#successMascot", {
          y: 0,
          scale: 1.1,
          duration: 0.5,
          ease: "bounce.out"
        });
      }
    });

    function playPopEffect() {
      const burst = $("#bubbleBurst");
      if (!burst) return;
      for (let i = 0; i < 14; i++) {
        const b = document.createElement("div");
        b.style.position = "absolute";
        b.style.left = "50%";
        b.style.top = "50%";
        b.style.width = (4 + Math.random() * 8) + "px";
        b.style.height = b.style.width;
        b.style.borderRadius = "50%";
        b.style.background = "rgba(255,255,255,0.9)";
        b.style.border = "1px solid rgba(148,237,255,0.7)";
        b.style.transform = "translate(-50%, -50%)";
        burst.appendChild(b);

        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 60;
        gsap.to(b, {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          opacity: 0,
          scale: 0.2,
          duration: 0.6 + Math.random() * 0.4,
          ease: "power2.out",
          onComplete: () => b.remove()
        });
      }
    }

    successMsg.textContent =
      payload.status === "confirmed"
        ? "¡Gracias por acompañarnos en este momento tan especial! 💗"
        : "Gracias por avisarnos, te vamos a extrañar. Con cariño te enviamos un abrazo grande. 🐚";

    if (payload.status === "confirmed") {
      launchConfetti();
      playExplosionSound(); // Sonido mágico sintetizado
      if (window.increaseBubbles) {
        window.increaseBubbles(); // Estallido de burbujas en 3D
      }
    }
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar confirmación ✦";
  });

  /* ---- Confetti + burbujas + estrellas ---- */
  function launchConfetti() {
    const canvas = $("#confetti-canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    const colors = ["#FFB3A0", "#FFD9E8", "#F3CE8B", "#E4D8FB", "#BFEFEA", "#FFFFFF"];
    const particles = [];
    for (let i = 0; i < 140; i++) {
      const shape = Math.random() > 0.66 ? "star" : Math.random() > 0.5 ? "bubble" : "square";
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3.5,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.2,
        shape
      });
    }

    let frame = 0;
    function drawStar(cx, cy, r, color) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        ctx.lineTo(cx + r * Math.cos(a1), cy + r * Math.sin(a1));
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    function tick() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.shape === "star") {
          drawStar(0, 0, p.size, p.color);
        } else if (p.shape === "bubble") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      });

      if (frame < 220) {
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    tick();
  }



  /* ============================================================
     12. EASTER EGGS
     ============================================================ */
  const eggModal = $("#eggModal");
  $("#eggClose").addEventListener("click", () => eggModal.classList.remove("show"));

  $$('[data-egg="shell"]').forEach((el) => {
    el.addEventListener("click", () => eggModal.classList.add("show"));
  });

  $$('[data-egg="sparkle"]').forEach((el) => {
    el.addEventListener("click", (e) => sparkleBurst(e.clientX, e.clientY));
  });

  function sparkleBurst(x, y) {
    for (let i = 0; i < 14; i++) {
      const s = document.createElement("div");
      s.style.position = "fixed";
      s.style.left = x + "px";
      s.style.top = y + "px";
      s.style.width = "6px";
      s.style.height = "6px";
      s.style.borderRadius = "50%";
      s.style.background = ["#FFB3A0", "#FFD9E8", "#F3CE8B", "#BFEFEA"][i % 4];
      s.style.pointerEvents = "none";
      s.style.zIndex = 1700;
      s.style.transition = "transform 1.1s cubic-bezier(.2,.8,.2,1), opacity 1.1s";
      document.body.appendChild(s);
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 60;
      requestAnimationFrame(() => {
        s.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
        s.style.opacity = "0";
      });
      setTimeout(() => s.remove(), 1200);
    }
  }

  /* ============================================================
     12b. MESA DE REGALOS (POPUP, LISTAR Y RESERVAR)
     ============================================================ */
  const giftsModal = $("#giftsModal");
  const openGiftsBtn = $("#openGiftsBtn");
  const giftsCloseBtn = $("#giftsCloseBtn");
  const giftsContainer = $("#giftsContainer");
  const giftReserveForm = $("#giftReserveForm");
  const selectedGiftName = $("#selectedGiftName");
  const giftReserverName = $("#giftReserverName");
  const confirmReserveBtn = $("#confirmReserveBtn");
  const cancelReserveBtn = $("#cancelReserveBtn");

  let selectedGiftId = null;
  let allGifts = [];

  if (openGiftsBtn) {
    openGiftsBtn.addEventListener("click", () => {
      giftsModal.classList.add("show");
      loadGifts();
    });
  }

  if (giftsCloseBtn) {
    giftsCloseBtn.addEventListener("click", () => {
      giftsModal.classList.remove("show");
      resetReserveForm();
    });
  }

  if (cancelReserveBtn) {
    cancelReserveBtn.addEventListener("click", () => {
      resetReserveForm();
    });
  }

  async function loadGifts() {
    try {
      giftsContainer.innerHTML = '<p style="text-align: center; color: var(--ink-faint); padding: 20px 0;">Cargando regalos del mar...</p>';
      const res = await fetch(`${API_BASE}/gifts`);
      if (!res.ok) throw new Error("Error al obtener los regalos");
      allGifts = await res.json();
      renderGifts(allGifts);
    } catch (err) {
      console.error(err);
      giftsContainer.innerHTML = '<p style="text-align: center; color: red; font-size: 13px; padding: 20px 0;">Error al cargar la lista de regalos. Por favor, intenta de nuevo.</p>';
    }
  }

  function renderGifts(gifts) {
    if (gifts.length === 0) {
      giftsContainer.innerHTML = '<p style="text-align: center; color: var(--ink-faint); padding: 20px 0;">No hay regalos en la lista en este momento.</p>';
      return;
    }

    giftsContainer.innerHTML = "";
    gifts.forEach(gift => {
      const row = document.createElement("div");
      row.className = `gift-item-row ${gift.reserved ? "reserved" : ""}`;
      
      const nameCol = document.createElement("span");
      nameCol.className = "gift-name-label";
      nameCol.textContent = gift.name;

      row.appendChild(nameCol);

      if (gift.reserved) {
        const statusCol = document.createElement("span");
        statusCol.className = "gift-reserve-status";
        statusCol.textContent = `Tomado por ${gift.reservedBy}`;
        row.appendChild(statusCol);
      } else {
        const btnCol = document.createElement("button");
        btnCol.className = "gift-reserve-btn";
        btnCol.textContent = "Tomar regalo 🎁";
        btnCol.addEventListener("click", () => {
          showReserveForm(gift.id, gift.name);
        });
        row.appendChild(btnCol);
      }

      giftsContainer.appendChild(row);
    });
  }

  function showReserveForm(id, name) {
    selectedGiftId = id;
    selectedGiftName.textContent = name;
    giftReserveForm.style.display = "block";
    giftReserverName.focus();
    
    // Scroll suave del modal hacia abajo para mostrar el formulario
    setTimeout(() => {
      const modalBody = giftsModal.querySelector(".gifts-card-modal");
      modalBody.scrollTo({
        top: modalBody.scrollHeight,
        behavior: "smooth"
      });
    }, 100);
  }

  function resetReserveForm() {
    selectedGiftId = null;
    selectedGiftName.textContent = "";
    giftReserverName.value = "";
    giftReserveForm.style.display = "none";
  }

  if (confirmReserveBtn) {
    confirmReserveBtn.addEventListener("click", async () => {
      const name = giftReserverName.value.trim();
      if (!name) {
        alert("Por favor, ingresa tu nombre completo para reservar el regalo.");
        giftReserverName.focus();
        return;
      }

      confirmReserveBtn.disabled = true;
      confirmReserveBtn.textContent = "Reservando...";

      try {
        const res = await fetch(`${API_BASE}/gifts/${selectedGiftId}/reserve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "No se pudo realizar la reserva");
        }

        resetReserveForm();
        launchConfetti();
        if (typeof playExplosionSound === "function") playExplosionSound();
        
        await loadGifts();
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        confirmReserveBtn.disabled = false;
        confirmReserveBtn.textContent = "Confirmar Reserva ✦";
      }
    });
  }

  /* ============================================================
     13. PWA — registro del service worker
     ============================================================ */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        navigator.serviceWorker.getRegistrations().then(regs => {
          for (let reg of regs) reg.unregister();
        });
      } else {
        navigator.serviceWorker.register("sw.js").catch(() => { });
      }
    });
  }
})();
