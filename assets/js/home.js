// ABOUTME: Homepage motion: animated power-grid canvas behind the hero, headline word reveal, scroll reveals.
// ABOUTME: Everything is skipped when the visitor prefers reduced motion; content is fully visible without JS.
(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;
  document.documentElement.classList.add("motion");

  // Headline: wrap each word so CSS can stagger them in.
  var h1 = document.querySelector(".hero h1");
  if (h1) {
    var words = h1.textContent.trim().split(/\s+/);
    h1.textContent = "";
    words.forEach(function (w, i) {
      var span = document.createElement("span");
      span.className = "word";
      span.style.setProperty("--i", i);
      span.textContent = w;
      h1.appendChild(span);
      if (i < words.length - 1) h1.appendChild(document.createTextNode(" "));
    });
  }

  // Scroll reveals.
  var revealables = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("in"); });
  }

  // Power grid: jittered lattice of nodes, pulses of energy hop edge to edge.
  var canvas = document.querySelector(".grid-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var nodes = [], edges = [], adjacency = [], pulses = [];
  var width = 0, height = 0, running = false, visible = true, lastSpawn = 0, lastTime = 0;
  var SPACING = 84, MAX_PULSES = 26, SPEED = 0.0011; // edge fraction per ms

  function build() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    nodes = []; edges = []; adjacency = []; pulses = [];
    var cols = Math.ceil(width / SPACING) + 2, rows = Math.ceil(height / SPACING) + 2;
    var index = function (c, r) { return r * cols + c; };
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        nodes.push({
          x: (c - 0.5) * SPACING + (Math.random() - 0.5) * SPACING * 0.5,
          y: (r - 0.5) * SPACING + (Math.random() - 0.5) * SPACING * 0.5,
          glow: 0
        });
        adjacency.push([]);
      }
    }
    function link(a, b) {
      var id = edges.length;
      edges.push({ a: a, b: b });
      adjacency[a].push(id);
      adjacency[b].push(id);
    }
    for (r = 0; r < rows; r++) {
      for (c = 0; c < cols; c++) {
        if (c + 1 < cols && Math.random() < 0.72) link(index(c, r), index(c + 1, r));
        if (r + 1 < rows && Math.random() < 0.72) link(index(c, r), index(c, r + 1));
        if (c + 1 < cols && r + 1 < rows && Math.random() < 0.14) link(index(c, r), index(c + 1, r + 1));
      }
    }
  }

  function spawn() {
    if (!edges.length) return;
    var e = Math.floor(Math.random() * edges.length);
    var forward = Math.random() < 0.5;
    pulses.push({ edge: e, from: forward ? edges[e].a : edges[e].b, t: 0, hops: 4 + Math.floor(Math.random() * 8) });
  }

  function step(now) {
    if (!running) return;
    var dt = Math.min(now - (lastTime || now), 48);
    lastTime = now;

    if (now - lastSpawn > 220 && pulses.length < MAX_PULSES) { spawn(); lastSpawn = now; }

    ctx.clearRect(0, 0, width, height);

    // Lines.
    ctx.strokeStyle = "rgba(246, 245, 241, 0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i < edges.length; i++) {
      var a = nodes[edges[i].a], b = nodes[edges[i].b];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    // Pulses with fading trails.
    for (var p = pulses.length - 1; p >= 0; p--) {
      var pulse = pulses[p];
      pulse.t += SPEED * dt;
      var edge = edges[pulse.edge];
      var to = edge.a === pulse.from ? edge.b : edge.a;
      var n0 = nodes[pulse.from], n1 = nodes[to];
      if (pulse.t >= 1) {
        n1.glow = 1;
        pulse.hops--;
        var options = adjacency[to].filter(function (id) { return id !== pulse.edge; });
        if (pulse.hops <= 0 || !options.length) { pulses.splice(p, 1); continue; }
        pulse.edge = options[Math.floor(Math.random() * options.length)];
        pulse.from = to;
        pulse.t = 0;
        continue;
      }
      var tail = Math.max(0, pulse.t - 0.45);
      var hx = n0.x + (n1.x - n0.x) * pulse.t, hy = n0.y + (n1.y - n0.y) * pulse.t;
      var tx = n0.x + (n1.x - n0.x) * tail, ty = n0.y + (n1.y - n0.y) * tail;
      var grad = ctx.createLinearGradient(tx, ty, hx, hy);
      grad.addColorStop(0, "rgba(0, 116, 141, 0)");
      grad.addColorStop(1, "rgba(0, 220, 103, 0.9)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.fillStyle = "rgba(150, 255, 196, 1)";
      ctx.beginPath();
      ctx.arc(hx, hy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nodes, lit up when a pulse arrives.
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.glow > 0) {
        ctx.fillStyle = "rgba(0, 220, 103, " + (0.35 * n.glow) + ")";
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3 + 9 * n.glow, 0, Math.PI * 2);
        ctx.fill();
        n.glow = Math.max(0, n.glow - dt / 900);
      }
      ctx.fillStyle = "rgba(246, 245, 241, " + (0.18 + 0.6 * n.glow) + ")";
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  function update() {
    var shouldRun = visible && !document.hidden;
    if (shouldRun && !running) { running = true; lastTime = 0; requestAnimationFrame(step); }
    else if (!shouldRun) running = false;
  }

  build();
  var resizeTimer;
  var lastWidth = width;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    // Mobile browsers fire resize when the URL bar hides; only rebuild on width changes.
    resizeTimer = setTimeout(function () { if (canvas.clientWidth !== lastWidth) { lastWidth = canvas.clientWidth; build(); } }, 200);
  });
  document.addEventListener("visibilitychange", update);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; update(); }).observe(canvas);
  }
  update();
})();
