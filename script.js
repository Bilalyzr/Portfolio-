document.addEventListener('DOMContentLoaded', () => {

    // --- 0. LENIS SMOOTH SCROLL INIT ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    window.lenis = lenis;

    // --- 1. GLOBAL: Scroll Animations & Navigation ---

    // Smooth Scroll for Nav Links handled by scroll-nav click listeners below

    // Scroll Spy (Active Scroll Indicator)
    const sections = document.querySelectorAll('section');
    const scrollLinks = document.querySelectorAll('.scroll-nav li');
    const scrollNavBox = document.querySelector('.scroll-nav');

    let lastScrollTop = 0;

    function updateActiveScroll() {
        let current = '';
        const st = window.pageYOffset || document.documentElement.scrollTop;

        // Determine Scroll Direction
        if (st > lastScrollTop) {
            document.body.classList.add('scroll-down');
            document.body.classList.remove('scroll-up');
        } else if (st < lastScrollTop) {
            document.body.classList.add('scroll-up');
            document.body.classList.remove('scroll-down');
        }
        lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling


        // Determine active section
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - sectionHeight / 3)) {
                current = '#' + section.getAttribute('id');
            }
        });

        // Update UI
        let activeIndex = 0;
        scrollLinks.forEach((link, index) => {
            link.classList.remove('active');
            if (link.dataset.target === current) {
                link.classList.add('active');
                activeIndex = index;
            }
        });

        // Move the visual line indicator
        const activeLink = document.querySelector('.scroll-nav li.active');
        if (activeLink && scrollNavBox) {
            const itemHeight = activeLink.offsetHeight + 20; // 20 is gap
            scrollNavBox.style.setProperty('--active-pos', `${activeLink.offsetTop}px`);
        }
        // Toggle Scroll Label based on position
        const scrollLabel = document.getElementById('scrollLabel');
        if (scrollLabel) {
            if (current === '#contact') {
                // Back To Top (Arrow First = Top in vertical mode)
                scrollLabel.innerHTML = '<i class="fas fa-chevron-up"></i><span>Back To Top</span>';
                scrollLabel.onclick = () => window.lenis.scrollTo(0);
            } else {
                // Scroll Down (Text First = Top in vertical mode)
                scrollLabel.innerHTML = '<span>Scroll Down</span><i class="fas fa-chevron-down"></i>';
                scrollLabel.onclick = () => {
                    const nextIndex = activeIndex + 1;
                    if (nextIndex < sections.length) {
                        window.lenis.scrollTo(sections[nextIndex]);
                    }
                };
            }
        }
    }

    window.addEventListener('scroll', updateActiveScroll);
    updateActiveScroll(); // Initial check

    // --- UPDATED: Warp Speed Page Transition ---
    const warpContainer = document.getElementById('warp-transition');

    // Select all navigation links (Sidebar + Top Contact + CTA Buttons)
    const allNavLinks = document.querySelectorAll('.scroll-nav li, .nav-contact-btn, .cta-btn, .mobile-nav-links a');

    allNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Get target ID (handle both data-target and href)
            const targetId = link.dataset.target || link.getAttribute('href');

            // Only run transition if target is a valid ID on this page
            if (targetId && targetId.startsWith('#') && document.querySelector(targetId)) {
                e.preventDefault(); // Stop default instant scroll

                // 1. Start Warp Effect
                warpContainer.classList.add('active');

                // 2. Teleport (Scroll) to section during the flash (at 800ms)
                setTimeout(() => {
                    document.querySelector(targetId).scrollIntoView({
                        behavior: 'auto', // INSTANT jump while screen is white
                        block: 'start'
                    });
                }, 800);

                // 3. End Warp Effect
                setTimeout(() => {
                    warpContainer.classList.remove('active');
                }, 1300);
            }
        });
    });



    // Fade Up Animation on Scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');



                // Trigger Path Animation if Journey Section
                if (entry.target.id === 'journey' || entry.target.querySelector('#journey')) {
                    const pathColumn = document.querySelector('.path-column');
                    if (pathColumn) pathColumn.classList.add('visible');
                }
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.fade-up, .fade-left, .fade-right, .zoom-in, section').forEach((el) => {
        observer.observe(el);
    });


    // --- 2. GLOBAL CANVAS STARFIELD + INTERACTIVE SPACE OBSTACLES ---
    (function initGlobalStarfield() {
        const canvas = document.getElementById('globalStarfield');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // --- Star Layers (3 depth levels) ---
        const LAYER_CONFIG = [
            { count: 200, speedFactor: 0.02, minSize: 0.3, maxSize: 1.0, baseOpacity: 0.25 },
            { count: 150, speedFactor: 0.06, minSize: 0.5, maxSize: 1.5, baseOpacity: 0.4 },
            { count: 80,  speedFactor: 0.12, minSize: 0.8, maxSize: 2.2, baseOpacity: 0.6 }
        ];

        let layers = [];
        let shootingStars = [];
        let meteorBursts = []; // Meteor click bursts
        let scrollY = 0;

        // Mouse position for black hole gravity
        let mouseX = -9999, mouseY = -9999;
        const GRAVITY_RADIUS = 120;
        const GRAVITY_STRENGTH = 0.6;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initLayers();
        }

        function initLayers() {
            layers = LAYER_CONFIG.map(cfg => {
                const stars = [];
                for (let i = 0; i < cfg.count; i++) {
                    stars.push({
                        x: Math.random() * canvas.width,
                        baseX: 0, // set after
                        y: Math.random() * canvas.height * 4,
                        size: Math.random() * (cfg.maxSize - cfg.minSize) + cfg.minSize,
                        opacity: cfg.baseOpacity + Math.random() * 0.3,
                        twinkleSpeed: Math.random() * 0.003 + 0.001,
                        twinklePhase: Math.random() * Math.PI * 2,
                        // Gravity displacement
                        dx: 0, dy: 0
                    });
                    stars[stars.length - 1].baseX = stars[stars.length - 1].x;
                }
                return { stars, speedFactor: cfg.speedFactor };
            });
        }

        window.addEventListener('scroll', () => { scrollY = window.pageYOffset; });

        // Track mouse for black hole cursor
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        document.addEventListener('mouseleave', () => {
            mouseX = -9999;
            mouseY = -9999;
        });

        // --- FEATURE: Meteor Click Burst ---
        canvas.style.pointerEvents = 'none'; // Canvas doesn't block clicks
        document.addEventListener('click', (e) => {
            // Don't trigger on interactive elements
            const tag = e.target.tagName.toLowerCase();
            const isInteractive = e.target.closest('a, button, .stack-card, .stack-nav, .planet, .skill-tile, .freq-btn, .scroll-nav li, model-viewer, input, textarea, .mobile-menu-btn, .mobile-nav-overlay');
            if (isInteractive || tag === 'a' || tag === 'button') return;

            const count = 6 + Math.floor(Math.random() * 4);
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
                const speed = Math.random() * 4 + 2;
                meteorBursts.push({
                    x: e.clientX,
                    y: e.clientY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.0,
                    decay: Math.random() * 0.02 + 0.015,
                    size: Math.random() * 1.5 + 0.8,
                    trail: []
                });
            }
        });

        // --- Shooting Stars ---
        function spawnShootingStar() {
            const startX = Math.random() * canvas.width;
            const startY = Math.random() * canvas.height * 0.5;
            const angle = (Math.random() * 40 + 140) * (Math.PI / 180);
            const speed = Math.random() * 8 + 6;
            shootingStars.push({
                x: startX, y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: Math.random() * 0.015 + 0.01,
                length: Math.random() * 80 + 60
            });
        }

        // --- Nebula Clouds ---
        const nebulae = [
            { cx: 0.2, cy: 0.3, r: 0.35, color: [0, 60, 180], drift: 0.00003 },
            { cx: 0.75, cy: 0.65, r: 0.3, color: [100, 0, 160], drift: -0.00002 }
        ];

        function drawNebulae(time) {
            nebulae.forEach(n => {
                const cx = (n.cx + Math.sin(time * n.drift) * 0.05) * canvas.width;
                const cy = (n.cy + Math.cos(time * n.drift * 0.7) * 0.04) * canvas.height;
                const r = n.r * Math.max(canvas.width, canvas.height);
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
                grad.addColorStop(0, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},0.06)`);
                grad.addColorStop(0.5, `rgba(${n.color[0]},${n.color[1]},${n.color[2]},0.025)`);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });
        }

        // --- Main Render Loop ---
        function render(time) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Nebula clouds
            drawNebulae(time);

            // 2. Star layers with parallax + BLACK HOLE CURSOR GRAVITY
            layers.forEach(layer => {
                const parallaxOffset = scrollY * layer.speedFactor;
                layer.stars.forEach(star => {
                    const y = (star.y - parallaxOffset) % (canvas.height * 4);
                    const screenY = ((y % canvas.height) + canvas.height) % canvas.height;
                    const drawX = star.baseX + star.dx;

                    // Black hole gravity: pull star toward cursor
                    const distX = mouseX - drawX;
                    const distY = mouseY - screenY;
                    const dist = Math.sqrt(distX * distX + distY * distY);

                    if (dist < GRAVITY_RADIUS && dist > 1) {
                        const force = (1 - dist / GRAVITY_RADIUS) * GRAVITY_STRENGTH;
                        star.dx += (distX / dist) * force;
                        star.dy += (distY / dist) * force;
                    } else {
                        // Spring back to original position
                        star.dx *= 0.95;
                        star.dy *= 0.95;
                    }

                    const finalX = drawX;
                    const finalY = screenY + star.dy;
                    const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
                    const alpha = star.opacity * twinkle;

                    // Star stretched toward cursor (subtle elongation)
                    if (dist < GRAVITY_RADIUS && dist > 1) {
                        const stretchFactor = 1 + (1 - dist / GRAVITY_RADIUS) * 1.5;
                        const stretchAngle = Math.atan2(distY, distX);
                        ctx.save();
                        ctx.translate(finalX, finalY);
                        ctx.rotate(stretchAngle);
                        ctx.scale(stretchFactor, 1);
                        ctx.beginPath();
                        ctx.arc(0, 0, star.size, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
                        ctx.fill();
                        ctx.restore();
                    } else {
                        ctx.beginPath();
                        ctx.arc(finalX, finalY, star.size, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
                        ctx.fill();
                    }

                    // Glow for larger stars
                    if (star.size > 1.5) {
                        ctx.beginPath();
                        ctx.arc(finalX, finalY, star.size * 3, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(0, 210, 255, ${alpha * 0.04})`;
                        ctx.fill();
                    }
                });
            });

            // 3. Shooting stars
            for (let i = shootingStars.length - 1; i >= 0; i--) {
                const s = shootingStars[i];
                s.x += s.vx; s.y += s.vy; s.life -= s.decay;
                if (s.life <= 0) { shootingStars.splice(i, 1); continue; }

                const mag = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
                const tailX = s.x - (s.vx / mag) * s.length;
                const tailY = s.y - (s.vy / mag) * s.length;

                const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(0.7, `rgba(200,230,255,${s.life * 0.5})`);
                grad.addColorStop(1, `rgba(255,255,255,${s.life})`);
                ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(s.x, s.y);
                ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();

                ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${s.life})`; ctx.fill();
            }

            // 4. METEOR CLICK BURSTS
            for (let i = meteorBursts.length - 1; i >= 0; i--) {
                const m = meteorBursts[i];
                m.x += m.vx; m.y += m.vy;
                m.vx *= 0.98; m.vy *= 0.98;
                m.life -= m.decay;

                // Store trail positions
                m.trail.push({ x: m.x, y: m.y });
                if (m.trail.length > 8) m.trail.shift();

                if (m.life <= 0) { meteorBursts.splice(i, 1); continue; }

                // Draw trail
                for (let j = 0; j < m.trail.length - 1; j++) {
                    const trailAlpha = (j / m.trail.length) * m.life * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(m.trail[j].x, m.trail[j].y);
                    ctx.lineTo(m.trail[j + 1].x, m.trail[j + 1].y);
                    ctx.strokeStyle = `rgba(0, 210, 255, ${trailAlpha})`;
                    ctx.lineWidth = m.size * (j / m.trail.length);
                    ctx.stroke();
                }

                // Draw head
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200, 240, 255, ${m.life})`;
                ctx.fill();

                // Head glow
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.size * 4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 210, 255, ${m.life * 0.15})`;
                ctx.fill();
            }

            // Spawn shooting stars
            if (Math.random() > 0.993) spawnShootingStar();

            requestAnimationFrame(render);
        }

        resize();
        window.addEventListener('resize', resize);
        requestAnimationFrame(render);
    })();

    // --- SATELLITE ORBIT (DOM element orbiting viewport edges) ---
    (function initSatellite() {
        const sat = document.createElement('div');
        sat.id = 'orbitingSatellite';
        sat.innerHTML = '<i class="fas fa-satellite" style="font-size:10px;color:rgba(200,220,255,0.5);"></i><span class="sat-blink"></span>';
        document.body.appendChild(sat);

        let angle = 0;
        const speed = 0.0006; // ~60s per orbit

        function updateSatellite() {
            angle += speed;
            if (angle > Math.PI * 2) angle -= Math.PI * 2;

            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const margin = 30;

            // Elliptical path along viewport edges
            const rx = vw / 2 - margin;
            const ry = vh / 2 - margin;
            const x = vw / 2 + Math.cos(angle) * rx;
            const y = vh / 2 + Math.sin(angle) * ry;

            sat.style.left = x + 'px';
            sat.style.top = y + 'px';

            // Rotation to face direction of travel
            const deg = angle * (180 / Math.PI) + 90;
            sat.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;

            requestAnimationFrame(updateSatellite);
        }

        requestAnimationFrame(updateSatellite);
    })();


    // --- 3. SKILLS: Interaction ---

    const skillsData = {
        react: { title: "React.js", icon: "fab fa-react", color: "#61dafb", tools: "Redux, React Router, Webpack", level: "Advanced", percent: "85%", desc: "SPAs, Interactive UIs, PWAs." },
        html: { title: "HTML5", icon: "fab fa-html5", color: "#e34f26", tools: "Semantic Tags, Canvas", level: "Expert", percent: "95%", desc: "Structural foundation, SEO optimization." },
        css: { title: "CSS3", icon: "fab fa-css3-alt", color: "#2965f1", tools: "Flexbox, Grid, Animations", level: "Advanced", percent: "90%", desc: "Responsive designs, complex layouts." },
        js: { title: "JavaScript", icon: "fab fa-js", color: "#f7df1e", tools: "ES6+, DOM, Fetch API", level: "Advanced", percent: "85%", desc: "Interactive logic, async operations." },
        node: { title: "Node.js", icon: "fab fa-node-js", color: "#6cc24a", tools: "Express, REST APIs", level: "Intermediate", percent: "70%", desc: "Server-side logic, scalable apps." },
        python: { title: "Python", icon: "fab fa-python", color: "#3776ab", tools: "Django, Flask, Pandas", level: "Intermediate", percent: "75%", desc: "Backend, data analysis, scripting." },
        sql: { title: "SQL / DB", icon: "fas fa-database", color: "#bd00ff", tools: "PostgreSQL, MongoDB", level: "Intermediate", percent: "80%", desc: "Data modeling, complex queries." },
        git: { title: "Git", icon: "fab fa-git-alt", color: "#f05032", tools: "GitHub, CI/CD", level: "Advanced", percent: "88%", desc: "Version control, collaboration." }
    };

    const skillCard = document.getElementById('skill-info-card');
    const planetsWrapper = document.getElementById('planets-wrapper');

    // Expose openSkill to global scope for HTML onclick
    window.openSkill = function (key) {
        const data = skillsData[key];
        document.getElementById('skill-icon').className = `${data.icon} tech-icon-large`;
        document.getElementById('skill-icon').style.color = data.color;
        document.getElementById('skill-title').innerText = data.title;
        document.getElementById('skill-tools').innerText = data.tools;
        document.getElementById('skill-level').innerText = data.level;
        document.getElementById('skill-percent').innerText = data.percent;
        document.getElementById('skill-desc').innerText = data.desc;

        const skillProgress = document.getElementById('skill-progress');
        // Reset width to 0 first to re-trigger animation
        skillProgress.style.width = '0%';

        skillCard.classList.add('open');
        if (planetsWrapper) planetsWrapper.classList.add('paused');

        // Animate Progress Bar after card is visible
        setTimeout(() => {
            skillProgress.style.width = data.percent;
        }, 300);
    };

    window.closeSkillCard = function () {
        skillCard.classList.remove('open');
        if (planetsWrapper) planetsWrapper.classList.remove('paused');
    };


    // --- 4. PROJECTS: Missions Log — Dossier System ---

    const projects = [
        {
            id: 1,
            codename: "ALPHA-01",
            name: "Control Mouse with Hand Gesture Detection",
            tools: "Python, OpenCV, MediaPipe",
            category: ["python", "ai"],
            missionClass: "RECON",
            status: "complete",
            icon: ["fab fa-python", "fas fa-robot"],
            brief: "Computer vision system for touchless interaction recognizing real-time hand gestures.",
            img: "assets/images/hand_gestures.png"
        },
        {
            id: 2,
            codename: "BETA-02",
            name: "Credit Card Fraud Detection Using ML",
            tools: "Python, Scikit-learn, Pandas, NumPy",
            category: ["python", "ai"],
            missionClass: "RECON",
            status: "complete",
            icon: ["fab fa-python", "fas fa-robot"],
            brief: "Machine learning classification model built to detect fraudulent financial transactions.",
            img: "assets/images/fraud_detection.png"
        },
        {
            id: 3,
            codename: "GAMMA-03",
            name: "Tutor LMS Platform (Internship)",
            tools: "React JS, WordPress, HTML/CSS",
            category: ["web", "react"],
            missionClass: "ORBITAL",
            status: "complete",
            icon: ["fab fa-react", "fab fa-wordpress"],
            brief: "Developed responsive interfaces and customized platform modules with AI-driven tools.",
            img: "assets/images/tutor_lms.png"
        },
        {
            id: 4,
            codename: "DELTA-04",
            name: "Department Conference Website Development",
            tools: "HTML, CSS, JavaScript, Figma",
            category: ["web"],
            missionClass: "CONSTRUCT",
            status: "complete",
            icon: ["fab fa-html5", "fab fa-css3-alt", "fab fa-figma"],
            brief: "Designed and developed a static web page for an international conference organized by the department.",
            img: "assets/images/conference_website.png"
        },
        {
            id: 5,
            codename: "ECHO-05",
            name: "SAST Organization Static Website",
            tools: "HTML, CSS, JavaScript, Figma",
            category: ["web"],
            missionClass: "CONSTRUCT",
            status: "complete",
            icon: ["fab fa-html5", "fab fa-css3-alt", "fab fa-js", "fab fa-figma"],
            brief: "Developed a fully static website for the SAST Organization, featuring a clean UI designed in Figma and brought to life with HTML, CSS, and JavaScript.",
            img: "assets/images/sast_website.png"
        }
    ];

    const projectsGrid = document.getElementById('projects-grid');
    const scanFlash = document.getElementById('scanFlash');

    // --- Holographic File Stack Carousel ---
    const stackContainer = document.getElementById('stackContainer');
    const dotsContainer = document.getElementById('navDots');
    let activeStackIndex = 0;

    function getFiltered(category) {
        return category === 'all' ? projects : projects.filter(p => p.category.includes(category));
    }

    let currentFilter = 'all';

    function renderStack() {
        const filtered = getFiltered(currentFilter);
        if (activeStackIndex >= filtered.length) activeStackIndex = 0;

        stackContainer.innerHTML = '';
        dotsContainer.innerHTML = '';

        filtered.forEach((p, i) => {
            const iconsHtml = p.icon.map(ic => `<i class="${ic}"></i>`).join(' ');
            const offset = i - activeStackIndex;

            const card = document.createElement('div');
            card.className = 'stack-card' + (i === activeStackIndex ? ' active' : '');

            // 3D stacking on desktop
            if (window.innerWidth > 768) {
                card.style.transform = `translateX(${offset * 30}px) translateZ(${-Math.abs(offset) * 80}px) rotateY(${offset * -5}deg)`;
                card.style.opacity = Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.2;
                card.style.zIndex = 10 - Math.abs(offset);
            }

            card.innerHTML = `
                <div class="sc-img">
                    <img src="${p.img}" alt="${p.name}">
                    <span class="sc-codename">${p.codename}</span>
                    <span class="sc-status"><span class="sc-status-dot"></span>COMPLETE</span>
                </div>
                <div class="sc-body">
                    <div class="sc-class">${p.missionClass}</div>
                    <div class="sc-name">${p.name}</div>
                    <div class="sc-tools"><span>PAYLOAD:</span> ${p.tools}</div>
                    <div class="sc-brief">${p.brief}</div>
                    <div class="sc-icons">${iconsHtml}</div>
                </div>
            `;

            card.addEventListener('click', () => {
                activeStackIndex = i;
                renderStack();
            });

            stackContainer.appendChild(card);

            // Nav dot
            const dot = document.createElement('div');
            dot.className = 'nav-dot' + (i === activeStackIndex ? ' active' : '');
            dot.addEventListener('click', () => {
                activeStackIndex = i;
                renderStack();
            });
            dotsContainer.appendChild(dot);
        });
    }

    // Nav arrows
    document.getElementById('prevBtn').addEventListener('click', () => {
        const f = getFiltered(currentFilter);
        activeStackIndex = (activeStackIndex - 1 + f.length) % f.length;
        renderStack();
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        const f = getFiltered(currentFilter);
        activeStackIndex = (activeStackIndex + 1) % f.length;
        renderStack();
    });

    window.filterProjects = function (category, btn) {
        document.querySelectorAll('.freq-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = category;
        activeStackIndex = 0;
        renderStack();
    };

    window.addEventListener('resize', renderStack);

    // Initial Load
    filterProjects('all', document.querySelector('.freq-btn.active'));





    // --- 6. MOBILE NAVIGATION Logic ---
    window.toggleMobileMenu = function () {
        const overlay = document.getElementById('mobileNav');
        overlay.classList.toggle('active');
    };

    // Stars + shooting stars now handled by #globalStarfield canvas

    // --- 7. INTERACTIVE HEADINGS (Giggle Effect) ---
    const interactiveTargets = document.querySelectorAll('.hero-role, .section-title, .skills-heading');

    interactiveTargets.forEach(el => {
        const nodes = Array.from(el.childNodes);
        el.innerHTML = ''; // Clear content to Javascript re-render

        nodes.forEach(node => {
            if (node.nodeType === 3) { // Text Node
                const text = node.textContent;
                for (let char of text) {
                    if (char.trim().length === 0) {
                        el.appendChild(document.createTextNode(char)); // Preserve spaces/newlines
                    } else {
                        const span = document.createElement('span');
                        span.className = 'interactive-letter';
                        span.innerText = char;
                        el.appendChild(span);
                    }
                }
            } else {
                el.appendChild(node.cloneNode(true)); // Preserve <br> and other tags
            }
        });

        // Add proper listener for interaction
        const letters = el.querySelectorAll('.interactive-letter');

        letters.forEach(letter => {
            letter.addEventListener('mouseenter', () => {
                // Clear state from all other letters in this group
                letters.forEach(l => l.classList.remove('active'));
                // Activate current
                letter.classList.add('active');
            });
            // Removed individual mouseleave to keep color active until next letter
        });

        // Clear all when leaving the entire heading area
        el.addEventListener('mouseleave', () => {
            letters.forEach(letter => letter.classList.remove('active'));
        });
    });

});

// --- 8. AUDIO: Space Ambience (Quiet Deep Space) ---
// Initialize strictly on first user interaction
const enableAudio = () => {
    if (window.hasSpaceAudioStarted) return;
    window.hasSpaceAudioStarted = true;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    // 2. Sound Design: "Deep Space Silence"
    // Using pure Sine waves for a smooth, non-intrusive rumble

    // Osc 1: Deep Sub-bass (The "Room Tone")
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 40;

    // Osc 2: Slow Pulse (creates a 4Hz subtle throb)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 44;

    // Osc 3: Breath/Air (Higher harmonic for presence, very quiet)
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 140;

    // Mix (Very quiet volumes)
    const g1 = ctx.createGain(); g1.gain.value = 0.4;  // Main rumble
    const g2 = ctx.createGain(); g2.gain.value = 0.4;  // Pulse
    const g3 = ctx.createGain(); g3.gain.value = 0.05; // Air (faint)

    osc1.connect(g1); g1.connect(masterGain);
    osc2.connect(g2); g2.connect(masterGain);
    osc3.connect(g3); g3.connect(masterGain);

    osc1.start();
    osc2.start();
    osc3.start();

    // 3. Fade In (Gentle)
    const now = ctx.currentTime;
    // Ramp to a low master volume (0.1 instead of 0.5) for "Quiet" effect
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.15, now + 5);

    console.log("Space Ambience: Deep Silence Encaged...");

    // 4. Auto Fade Out after 45s
    setTimeout(() => {
        const stopNow = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(stopNow);
        masterGain.gain.setValueAtTime(masterGain.gain.value, stopNow);
        masterGain.gain.linearRampToValueAtTime(0, stopNow + 8); // Longer 8s fade out for smoothness

        setTimeout(() => {
            osc1.stop(); osc2.stop(); osc3.stop();
            ctx.close();
            console.log("Space Ambience: Faded.");
        }, 8000);
    }, 45000);
};

// Listen for ANY interaction to start the sound
document.body.addEventListener('click', enableAudio, { once: true });
document.body.addEventListener('touchstart', enableAudio, { once: true });
document.body.addEventListener('scroll', enableAudio, { once: true });
document.body.addEventListener('keydown', enableAudio, { once: true });


// Shooting stars now handled by #globalStarfield canvas

// --- 10. HERO: Button 3D Tilt Effect ---
function initButtonTilt() {
    const wrapper = document.getElementById('btnWrapper');
    const btn = document.getElementById('btn');
    const planet = document.querySelector('.saturn-container');

    if (!wrapper || !btn || !planet) return;

    wrapper.addEventListener('mousemove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        // Calculate mouse position relative to center of button
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        // Sensitivity factor (higher number = less movement)
        const rotateX = -1 * (y / 5); // Increased sensitivity slightly for smaller button
        const rotateY = (x / 5);

        // Apply rotation to button
        btn.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        // Move planet slightly differently for 3D parallax depth
        // Maintain the base rotation (20deg) + parallax translation
        planet.style.transform = `rotate(20deg) translate(${x * 0.1}px, ${y * 0.1}px)`;
    });

    // Reset positions when mouse leaves the area
    wrapper.addEventListener('mouseleave', () => {
        btn.style.transform = 'rotateX(0) rotateY(0)';
        planet.style.transform = 'rotate(20deg) translate(0, 0)';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initButtonTilt();
});

// --- 11. STELLAR TRAJECTORY: Warp Trail Particle Canvas ---
function initWarpTrail() {
    const canvas = document.getElementById('warpTrailCanvas');
    if (!canvas) return;

    const section = document.getElementById('journey');
    if (!section) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let isVisible = false;

    function resizeCanvas() {
        const rect = section.getBoundingClientRect();
        canvas.width = section.offsetWidth;
        canvas.height = section.offsetHeight;
    }

    // Get center positions of each celestial body
    function getNodePositions() {
        const nodes = section.querySelectorAll('.celestial-body');
        const sectionRect = section.getBoundingClientRect();
        const positions = [];

        nodes.forEach(node => {
            const rect = node.getBoundingClientRect();
            positions.push({
                x: rect.left + rect.width / 2 - sectionRect.left,
                y: rect.top + rect.height / 2 - sectionRect.top
            });
        });

        return positions;
    }

    // Cubic bezier point between two positions with slight curve
    function bezierPoint(p0, p1, t, curveAmount) {
        const mx = (p0.x + p1.x) / 2;
        const my = (p0.y + p1.y) / 2;
        const cp = { x: mx, y: my - curveAmount };

        const u = 1 - t;
        return {
            x: u * u * p0.x + 2 * u * t * cp.x + t * t * p1.x,
            y: u * u * p0.y + 2 * u * t * cp.y + t * t * p1.y
        };
    }

    function createParticle(positions) {
        if (positions.length < 2) return null;

        // Pick a random segment
        const segIndex = Math.floor(Math.random() * (positions.length - 1));
        const from = positions[segIndex];
        const to = positions[segIndex + 1];

        // Color based on segment
        const colors = [
            { r: 0, g: 224, b: 255 },    // Cyan (asteroid->moon)
            { r: 168, g: 85, b: 247 },   // Purple (moon->planet)
            { r: 255, g: 200, b: 50 }    // Gold (planet->star)
        ];
        const color = colors[segIndex] || colors[0];

        return {
            from: from,
            to: to,
            t: 0,
            speed: 0.003 + Math.random() * 0.006,
            size: Math.random() * 2 + 0.8,
            color: color,
            curve: (Math.random() - 0.5) * 60,
            trail: [],
            maxTrail: 12 + Math.floor(Math.random() * 8)
        };
    }

    function updateAndDraw(time) {
        if (!isVisible) {
            animationId = requestAnimationFrame(updateAndDraw);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const positions = getNodePositions();

        // Spawn new particles
        if (particles.length < 30 && Math.random() > 0.85) {
            const p = createParticle(positions);
            if (p) particles.push(p);
        }

        // Update and draw
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.t += p.speed;

            if (p.t >= 1) {
                particles.splice(i, 1);
                continue;
            }

            const pos = bezierPoint(p.from, p.to, p.t, p.curve);
            p.trail.push({ x: pos.x, y: pos.y });

            if (p.trail.length > p.maxTrail) {
                p.trail.shift();
            }

            // Draw trail
            if (p.trail.length > 1) {
                for (let j = 0; j < p.trail.length - 1; j++) {
                    const alpha = (j / p.trail.length) * 0.4;
                    const width = (j / p.trail.length) * p.size;
                    ctx.beginPath();
                    ctx.moveTo(p.trail[j].x, p.trail[j].y);
                    ctx.lineTo(p.trail[j + 1].x, p.trail[j + 1].y);
                    ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
                    ctx.lineWidth = width;
                    ctx.stroke();
                }
            }

            // Draw head
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.9)`;
            ctx.fill();

            // Glow
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, p.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.1)`;
            ctx.fill();
        }

        // Draw faint constellation lines between nodes
        if (positions.length > 1) {
            for (let i = 0; i < positions.length - 1; i++) {
                const from = positions[i];
                const to = positions[i + 1];

                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 8]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Tiny constellation dots at each node
            positions.forEach(pos => {
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.fill();
            });
        }

        animationId = requestAnimationFrame(updateAndDraw);
    }

    // Visibility observer to pause when offscreen
    const visObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
            if (isVisible) resizeCanvas();
        });
    }, { threshold: 0.1 });

    visObserver.observe(section);

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animationId = requestAnimationFrame(updateAndDraw);
}

document.addEventListener('DOMContentLoaded', () => {
    initWarpTrail();
});

