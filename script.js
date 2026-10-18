document.addEventListener('DOMContentLoaded', () => {

    // --- Accessibility: honor the user's reduced-motion preference ---
    const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- 0. LENIS SMOOTH SCROLL INIT ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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

    // Scroll Spy (Active Scroll Indicator) - Cached for performance to avoid reflow thrashing
    const sections = document.querySelectorAll('section');
    const scrollLinks = document.querySelectorAll('.scroll-nav li');
    const scrollNavBox = document.querySelector('.scroll-nav');

    let lastScrollTop = 0;
    let currentActiveIndex = -1;
    let sectionPositions = [];

    // Cache section layout properties once to eliminate read reflow thrashes on scroll
    function cacheSectionPositions() {
        sectionPositions = Array.from(sections).map(section => ({
            id: '#' + section.getAttribute('id'),
            top: section.offsetTop,
            height: section.clientHeight
        }));
    }
    
    // Initial caching and refresh on resize
    cacheSectionPositions();
    window.addEventListener('resize', cacheSectionPositions);

    function updateActiveScroll() {
        let current = '';
        const st = window.pageYOffset || document.documentElement.scrollTop;

        // Determine Scroll Direction with class check to avoid layout thrashing
        if (st > lastScrollTop) {
            if (!document.body.classList.contains('scroll-down')) {
                document.body.classList.add('scroll-down');
                document.body.classList.remove('scroll-up');
            }
        } else if (st < lastScrollTop) {
            if (!document.body.classList.contains('scroll-up')) {
                document.body.classList.add('scroll-up');
                document.body.classList.remove('scroll-down');
            }
        }
        lastScrollTop = st <= 0 ? 0 : st;

        // Determine active section using our high-performance cached layout array
        const windowScrollY = window.pageYOffset || document.documentElement.scrollTop;
        for (let i = 0; i < sectionPositions.length; i++) {
            const pos = sectionPositions[i];
            if (windowScrollY >= (pos.top - pos.height / 3)) {
                current = pos.id;
            }
        }

        // Find the active index
        let activeIndex = 0;
        for (let i = 0; i < scrollLinks.length; i++) {
            if (scrollLinks[i].dataset.target === current) {
                activeIndex = i;
                break;
            }
        }

        // Only trigger DOM writes and layout property reads if active index changes
        if (activeIndex !== currentActiveIndex) {
            currentActiveIndex = activeIndex;

            scrollLinks.forEach((link, index) => {
                if (index === activeIndex) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // Sync active sector highlight inside Mobile Orbital Command Deck
            document.querySelectorAll('.mobile-nav-links .mnav-item').forEach((mItem, index) => {
                mItem.classList.toggle('active', index === activeIndex);
            });

            const activeLink = scrollLinks[activeIndex];
            if (activeLink && scrollNavBox) {
                // Update CSS variable only when active section switches
                scrollNavBox.style.setProperty('--active-pos', `${activeLink.offsetTop}px`);
            }

            // Toggle Scroll Label based on position
            const scrollLabel = document.getElementById('scrollLabel');
            if (scrollLabel) {
                if (current === '#contact') {
                    scrollLabel.innerHTML = '<i class="fas fa-chevron-up"></i><span>Back To Top</span>';
                    scrollLabel.onclick = () => window.lenis.scrollTo(0);
                } else {
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
    }

    window.addEventListener('scroll', updateActiveScroll);
    updateActiveScroll(); // Initial check

    // --- UPDATED: Warp Speed Page Transition ---
    const warpContainer = document.getElementById('warp-transition');

    // Select all navigation links (Sidebar + Top Contact + CTA Buttons)
    const allNavLinks = document.querySelectorAll('.scroll-nav li, .nav-contact-btn, .cta-btn, .space-button, .mobile-nav-links a');

    allNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Get target ID (handle both data-target and href)
            const targetId = link.dataset.target || link.getAttribute('href');

            // Only run transition if target is a valid ID on this page
            if (targetId && targetId.startsWith('#') && document.querySelector(targetId)) {
                e.preventDefault(); // Stop default instant scroll

                // Bug #6 fix: Close mobile nav if it's open before starting warp
                const mobileNav = document.getElementById('mobileNav');
                const mobileTrigger = document.getElementById('mobileMenuTrigger');
                if (mobileNav && mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
                    if (mobileTrigger) {
                        mobileTrigger.classList.remove('active');
                        mobileTrigger.setAttribute('aria-expanded', 'false');
                    }
                }

                // 1. Start Warp Effect
                if (warpContainer) {
                    warpContainer.classList.add('active');
                }

                // 2. Teleport (Scroll) to section during the flash (at 800ms)
                setTimeout(() => {
                    if (window.lenis) {
                        window.lenis.scrollTo(targetId, { immediate: true });
                    } else {
                        document.querySelector(targetId).scrollIntoView({
                            behavior: 'auto', // INSTANT jump while screen is white
                            block: 'start'
                        });
                    }
                }, 800);

                // 3. End Warp Effect
                setTimeout(() => {
                    if (warpContainer) {
                        warpContainer.classList.remove('active');
                    }
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

    // --- Astronaut Touch / Click / Hover Name Reveal ---
    const astronautContainer = document.getElementById('astronautContainer');
    const astronautSpeechBubble = document.getElementById('astronautSpeechBubble');
    if (astronautContainer && astronautSpeechBubble) {
        let bubbleHideTimer = null;

        const revealAstronautName = (autoHideMs = 0) => {
            if (bubbleHideTimer) clearTimeout(bubbleHideTimer);
            astronautSpeechBubble.classList.add('active');
            if (autoHideMs > 0) {
                bubbleHideTimer = setTimeout(() => {
                    astronautSpeechBubble.classList.remove('active');
                }, autoHideMs);
            }
        };

        astronautContainer.addEventListener('mouseenter', () => revealAstronautName(0));
        astronautContainer.addEventListener('mouseleave', () => {
            if (bubbleHideTimer) clearTimeout(bubbleHideTimer);
            astronautSpeechBubble.classList.remove('active');
        });
        astronautContainer.addEventListener('pointerdown', () => revealAstronautName(4500));
        astronautContainer.addEventListener('touchstart', () => revealAstronautName(4500), { passive: true });
        astronautContainer.addEventListener('click', () => revealAstronautName(4500));
    }


    // --- 2. GLOBAL CANVAS BACKGROUND — Static Starfield & Faint Constellation Grid ---
    // Non-animated: a still field of stars with subtle nebula halos and faint constellation
    // threads drawn once (and on resize) for a deep space backdrop.
    (function initStaticStarfield() {
        const canvas = document.getElementById('globalStarfield');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const STAR_TINTS = [
            'rgba(255,255,255,',
            'rgba(160,220,255,',
            'rgba(140,190,255,',
            'rgba(200,170,255,'
        ];

        function draw() {
            const W = window.innerWidth;
            const H = window.innerHeight;
            const DPR = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = W * DPR;
            canvas.height = H * DPR;
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            ctx.clearRect(0, 0, W, H);

            const count = Math.min(240, Math.max(90, Math.round((W * H) / 8500)));
            const brightStars = [];

            for (let i = 0; i < count; i++) {
                const depth = Math.random();
                const size = 0.5 + depth * 1.45;
                const alpha = 0.25 + depth * 0.58;
                const x = Math.random() * W;
                const y = Math.random() * H;
                const tint = STAR_TINTS[(Math.random() * STAR_TINTS.length) | 0];

                ctx.fillStyle = tint + alpha + ')';
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();

                if (size > 1.4) {
                    ctx.fillStyle = tint + (alpha * 0.14) + ')';
                    ctx.beginPath();
                    ctx.arc(x, y, size * 2.8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        draw();
        // Redraw only on resize (still no continuous animation)
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(draw, 150);
        });
    })();

    // --- 3. SKILLS: Interaction ---

    const skillsData = {
        react: {
            title: "React.js",
            planet: "SECTOR // EARTH",
            planetTex: "assets/images/planets/earth.jpg",
            icon: "fab fa-react",
            color: "#61dafb",
            tools: "React.js, Next.js, Redux, React Router",
            level: "Advanced",
            percent: "85%",
            desc: "Building dynamic single-page applications, interactive UIs, and progressive web architectures."
        },
        html: {
            title: "HTML5",
            planet: "SECTOR // MARS",
            planetTex: "assets/images/planets/mars.jpg",
            icon: "fab fa-html5",
            color: "#ff784f",
            tools: "Semantic HTML5, Accessibility, Canvas",
            level: "Expert",
            percent: "95%",
            desc: "Crafting semantic document architecture, ARIA accessibility standards, and SEO optimization."
        },
        css: {
            title: "CSS3",
            planet: "SECTOR // NEPTUNE",
            planetTex: "assets/images/planets/neptune.jpg",
            icon: "fab fa-css3-alt",
            color: "#60a5fa",
            tools: "Flexbox, CSS Grid, Responsive Design, 3D CSS",
            level: "Advanced",
            percent: "90%",
            desc: "Engineering responsive fluid layouts, 3D transforms, and hardware-accelerated animations."
        },
        js: {
            title: "JavaScript",
            planet: "SECTOR // VENUS",
            planetTex: "assets/images/planets/venus.jpg",
            icon: "fab fa-js",
            color: "#f7df1e",
            tools: "ES6+, Async/Await, DOM, REST APIs",
            level: "Advanced",
            percent: "85%",
            desc: "Developing interactive client logic, high-performance DOM manipulation, and async workflows."
        },
        node: {
            title: "Node.js",
            planet: "SECTOR // MERCURY",
            planetTex: "assets/images/planets/mercury.jpg",
            icon: "fab fa-node-js",
            color: "#8de963",
            tools: "Express.js, FastAPI, REST APIs, GraphQL",
            level: "Intermediate",
            percent: "75%",
            desc: "Designing server-side architectures, microservices, and scalable REST & GraphQL APIs."
        },
        python: {
            title: "Python",
            planet: "SECTOR // JUPITER",
            planetTex: "assets/images/planets/jupiter.jpg",
            icon: "fab fa-python",
            color: "#ffd43b",
            tools: "FastAPI, Scikit-learn, Pandas, NumPy, XGBoost",
            level: "Intermediate",
            percent: "80%",
            desc: "Training machine learning classification models, AI security firewalls, and backend services."
        },
        sql: {
            title: "Databases & SQL",
            planet: "SECTOR // SATURN",
            planetTex: "assets/images/planets/saturn.jpg",
            icon: "fas fa-database",
            color: "#e9d5ff",
            tools: "PostgreSQL, MySQL, MongoDB, Supabase",
            level: "Intermediate",
            percent: "80%",
            desc: "Relational & NoSQL data modeling, normalized schema design, and query optimization."
        },
        git: {
            title: "Git & DevOps",
            planet: "SECTOR // URANUS",
            planetTex: "assets/images/planets/uranus.jpg",
            icon: "fab fa-git-alt",
            color: "#ff7b61",
            tools: "Git, GitHub, Docker, VS Code, CI/CD",
            level: "Advanced",
            percent: "88%",
            desc: "Managing distributed version control, Docker containerization, and automated CI/CD pipelines."
        }
    };

    const skillCard = document.getElementById('skill-info-card');
    const universeContainer = document.querySelector('#skills .universe-container');

    // Expose openSkill to global scope for HTML onclick
    window.openSkill = function (key) {
        const data = skillsData[key];
        if (!data || !skillCard) return;

        skillCard.style.setProperty('--sk-accent', data.color);

        const iconEl = document.getElementById('skill-icon');
        if (iconEl) {
            iconEl.className = `${data.icon} tech-icon-large`;
            iconEl.style.color = data.color;
        }

        const planetMiniEl = document.getElementById('skill-planet-mini');
        if (planetMiniEl && data.planetTex) {
            planetMiniEl.style.backgroundImage = `url('${data.planetTex}')`;
        }

        const planetNameEl = document.getElementById('skill-planet-name');
        if (planetNameEl) {
            planetNameEl.innerText = data.planet || 'SECTOR // ORBIT';
        }

        document.getElementById('skill-title').innerText = data.title;

        const toolsContainer = document.getElementById('skill-tools');
        if (toolsContainer) {
            toolsContainer.innerHTML = data.tools
                .split(',')
                .map(t => `<span class="sk-tool-pill">${t.trim()}</span>`)
                .join('');
        }

        document.getElementById('skill-level').innerText = data.level;
        document.getElementById('skill-percent').innerText = data.percent;
        document.getElementById('skill-desc').innerText = data.desc;

        const skillProgress = document.getElementById('skill-progress');
        // Reset width to 0 first to re-trigger animation
        skillProgress.style.width = '0%';

        skillCard.classList.add('open');
        if (universeContainer) universeContainer.classList.add('paused-orbit');

        // Animate Progress Bar after card is visible
        setTimeout(() => {
            skillProgress.style.width = data.percent;
        }, 260);
    };

    window.closeSkillCard = function () {
        if (!skillCard) return;
        skillCard.classList.remove('open');
        if (universeContainer) universeContainer.classList.remove('paused-orbit');
    };

    // Hero 3D Tech Planets: Click / Enter opens corresponding Skill Telemetry Dossier
    document.querySelectorAll('#home .planet-body[data-skill]').forEach((planetEl) => {
        const triggerPlanetSkill = () => {
            const skillKey = planetEl.getAttribute('data-skill');
            if (!skillKey || !skillsData[skillKey]) return;
            const skillsSection = document.getElementById('skills');
            if (skillsSection) {
                if (window.lenis) {
                    window.lenis.scrollTo(skillsSection);
                } else {
                    skillsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
            setTimeout(() => {
                window.openSkill(skillKey);
            }, 550);
        };

        planetEl.addEventListener('click', triggerPlanetSkill);
        planetEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerPlanetSkill();
            }
        });
    });


    // --- 4. PROJECTS: Missions Log — Galactic Star-Chart Dossier System ---

    const projects = [
        {
            id: 1,
            codename: "ALPHA-01",
            sector: "SECTOR α-01 · MERCURY ORBIT",
            planetTex: "assets/images/planets/mercury.jpg",
            accent: "#00e0ff",
            name: "Control Mouse with Hand Gesture Detection",
            tools: "Python, OpenCV, MediaPipe",
            category: ["python", "ai"],
            missionClass: "RECON",
            status: "complete",
            icon: ["fab fa-python", "fas fa-robot"],
            brief: "Built a computer vision system for touchless cursor control that recognizes real-time hand gestures.",
            img: "assets/images/hand_gestures.png"
        },
        {
            id: 2,
            codename: "BETA-02",
            sector: "SECTOR β-02 · VENUSIAN CORE",
            planetTex: "assets/images/planets/venus.jpg",
            accent: "#f59e0b",
            name: "Credit Card Fraud Detection Using Machine Learning",
            tools: "Python, Scikit-learn, Pandas, NumPy",
            category: ["python", "ai"],
            missionClass: "RECON",
            status: "complete",
            icon: ["fab fa-python", "fas fa-robot"],
            brief: "Built a classification model for fraudulent transaction detection using structured data preprocessing and transaction behavior patterns.",
            img: "assets/images/fraud_detection.png"
        },
        {
            id: 3,
            codename: "GAMMA-03",
            sector: "SECTOR γ-03 · TERRA STATION",
            planetTex: "assets/images/planets/earth.jpg",
            accent: "#38bdf8",
            name: "Tutor LMS Platform | Sasha Infinity",
            tools: "React.js, WordPress, Tutor LMS, AI Integration",
            category: ["web", "react"],
            missionClass: "ORBITAL",
            status: "complete",
            icon: ["fab fa-react", "fab fa-wordpress"],
            brief: "Developed and maintained a Tutor LMS-based e-learning platform supporting online course delivery, WordPress performance optimization, and AI tool integrations.",
            img: "assets/images/tutor_lms.png"
        },
        {
            id: 4,
            codename: "DELTA-04",
            sector: "SECTOR δ-04 · MARTIAN RELAY",
            planetTex: "assets/images/planets/mars.jpg",
            accent: "#fb7185",
            name: "AISCCT International Conference Website",
            tools: "HTML, CSS, JavaScript, Figma",
            category: ["web"],
            missionClass: "CONSTRUCT",
            status: "complete",
            icon: ["fab fa-html5", "fab fa-css3-alt", "fab fa-figma"],
            brief: "Designed and developed a responsive static website for an international conference organized by the department.",
            img: "assets/images/conference_website.png",
            preview_url: "https://www.sonatech.ac.in/aiscct-26/"
        },
        {
            id: 5,
            codename: "ECHO-05",
            sector: "SECTOR ε-05 · JOVIAN CITADEL",
            planetTex: "assets/images/planets/jupiter.jpg",
            accent: "#c084fc",
            name: "SAST Organization Static Website",
            tools: "HTML, CSS, JavaScript, Figma",
            category: ["web"],
            missionClass: "CONSTRUCT",
            status: "complete",
            icon: ["fab fa-html5", "fab fa-css3-alt", "fab fa-js", "fab fa-figma"],
            brief: "Developed a fully static website for the SAST Organization, featuring a clean UI designed in Figma and brought to life with HTML, CSS, and JavaScript.",
            img: "assets/images/sast_website.png",
            preview_url: "https://sast.org.in/"
        },
        {
            id: 6,
            codename: "FOXTROT-06",
            sector: "SECTOR ζ-06 · SATURN RING",
            planetTex: "assets/images/planets/saturn.jpg",
            accent: "#facc15",
            name: "Nexora Startup Landing Page",
            tools: "HTML, CSS, JavaScript, Figma",
            category: ["web"],
            missionClass: "CONSTRUCT",
            status: "complete",
            icon: ["fab fa-html5", "fab fa-css3-alt", "fab fa-js", "fab fa-figma"],
            brief: "Designed and developed a modern startup landing page to showcase the Niral Thiruvizha 3.0 project.",
            img: "assets/images/niral_landing.png",
            preview_url: "https://nexora-indusio.netlify.app/"
        },
        {
            id: 7,
            codename: "GOLF-07",
            sector: "SECTOR η-07 · URANIAN NEXUS",
            planetTex: "assets/images/planets/uranus.jpg",
            accent: "#2dd4bf",
            name: "THOZHIRPORUL – Smart Industrial Monitoring System",
            tools: "React.js, Node.js, Express.js, PostgreSQL, Docker",
            category: ["web", "react", "ai"],
            missionClass: "COMMAND",
            status: "complete",
            icon: ["fab fa-react", "fab fa-node-js", "fas fa-database", "fas fa-brain"],
            brief: "Developed a full-stack industrial governance platform featuring dashboards, GIS-based park mapping, compliance tracking, workflow automation, and AI-assisted decision support.",
            img: "assets/images/thozhirporul.png"
        },
        {
            id: 8,
            codename: "HOTEL-08",
            sector: "SECTOR θ-08 · NEPTUNE SHIELD",
            planetTex: "assets/images/planets/neptune.jpg",
            accent: "#818cf8",
            name: "Dual-Layer AI Firewall for Securing LLM Applications",
            tools: "Python, FastAPI, XGBoost, Docker, PostgreSQL",
            category: ["python", "ai"],
            missionClass: "SHIELD",
            status: "complete",
            icon: ["fab fa-python", "fas fa-shield-alt", "fas fa-brain", "fab fa-docker"],
            brief: "Developed an AI firewall that detects and blocks prompt-injection attacks on LLM applications using ML classification and behavioral analysis.",
            img: "assets/images/llm_firewall.png",
            preview_url: "https://dual-layer-firewalls.vercel.app/"
        }
    ];

    // --- 3D Planetary Orbit Map + Wide Mission Console ---
    const stackContainer = document.getElementById('stackContainer');
    const dotsContainer = document.getElementById('navDots');
    const starmapNodesEl = document.getElementById('starmapNodes');
    const starmapCoreSphere = document.getElementById('starmapCoreSphere');
    const starmapCoreCode = document.getElementById('starmapCoreCode');
    const starmapCore = document.getElementById('starmapCore');
    const starmapLaserLine = document.getElementById('starmapLaserLine');
    let activeStackIndex = 0;

    function getFiltered(category) {
        return category === 'all' ? projects : projects.filter(p => p.category.includes(category));
    }

    let currentFilter = 'all';

    function renderStack() {
        const filtered = getFiltered(currentFilter);
        if (!filtered.length) return;
        if (activeStackIndex >= filtered.length) activeStackIndex = 0;

        stackContainer.innerHTML = '';
        dotsContainer.innerHTML = '';
        if (starmapNodesEl) starmapNodesEl.innerHTML = '';

        const activeProject = filtered[activeStackIndex];
        const total = filtered.length;

        // 1. Update Central 3D Planet Core on Star-Map
        if (starmapCoreSphere && activeProject) {
            starmapCoreSphere.style.backgroundImage = `url('${activeProject.planetTex}')`;
        }
        if (starmapCore && activeProject) {
            starmapCore.style.setProperty('--core-accent', activeProject.accent || '#00e0ff');
        }
        if (starmapCoreCode && activeProject) {
            starmapCoreCode.textContent = activeProject.codename;
        }

        // 2. Render Orbiting Mission Planet Nodes on the 3D Star-Map
        filtered.forEach((p, i) => {
            const isActive = i === activeStackIndex;

            // Distribute planets evenly around 360deg, alternating between outer (41% radius) and mid (30% radius) orbital rings
            const angleDeg = -90 + (i * (360 / total));
            const rad = (angleDeg * Math.PI) / 180;
            const radiusPct = (total >= 5 && i % 2 === 1) ? 30 : 41;
            const xPct = 50 + Math.cos(rad) * radiusPct;
            const yPct = 50 + Math.sin(rad) * radiusPct;

            if (isActive && starmapLaserLine) {
                starmapLaserLine.setAttribute('x2', (xPct * 4).toFixed(1));
                starmapLaserLine.setAttribute('y2', (yPct * 4).toFixed(1));
                starmapLaserLine.style.stroke = p.accent || '#00e0ff';
            }

            if (starmapNodesEl) {
                const nodeBtn = document.createElement('button');
                nodeBtn.type = 'button';
                nodeBtn.className = 'starmap-node' + (isActive ? ' active' : '');
                nodeBtn.style.left = `${xPct}%`;
                nodeBtn.style.top = `${yPct}%`;
                nodeBtn.style.setProperty('--node-accent', p.accent || '#00e0ff');
                nodeBtn.setAttribute('aria-label', `Select mission ${p.codename}: ${p.name}`);
                nodeBtn.innerHTML = `
                    <span class="sm-node-reticle"></span>
                    <span class="sm-node-sphere" style="background-image: url('${p.planetTex}');"></span>
                    <span class="sm-node-code">${p.codename}</span>
                `;
                nodeBtn.addEventListener('click', () => {
                    if (activeStackIndex !== i) {
                        activeStackIndex = i;
                        renderStack();
                    }
                });
                starmapNodesEl.appendChild(nodeBtn);
            }

            // Orbital Planet Nav Dot
            const dot = document.createElement('div');
            dot.className = 'nav-dot' + (isActive ? ' active' : '');
            dot.style.setProperty('--dot-accent', p.accent || '#00e0ff');
            dot.title = `${p.codename} — ${p.name}`;
            dot.addEventListener('click', () => {
                activeStackIndex = i;
                renderStack();
            });
            dotsContainer.appendChild(dot);
        });

        // 3. Render Wide Holographic Mission Console for the Active Mission
        if (activeProject) {
            const p = activeProject;
            const iconsHtml = p.icon.map(ic => `<i class="${ic}"></i>`).join(' ');
            const toolPillsHtml = p.tools
                .split(',')
                .map(t => `<span class="sc-tech-pill">${t.trim()}</span>`)
                .join('');

            const consoleCard = document.createElement('div');
            consoleCard.className = 'mission-console-card';
            consoleCard.style.setProperty('--card-accent', p.accent || '#00e0ff');

            consoleCard.innerHTML = `
                <div class="mc-topbar">
                    <div class="mc-topbar-left">
                        <span class="sc-planet-orb" style="background-image: url('${p.planetTex}');"></span>
                        <span class="mc-codename">${p.codename}</span>
                        <span class="mc-divider">//</span>
                        <span class="mc-sector">${p.sector}</span>
                    </div>
                    <div class="mc-topbar-right">
                        <span class="sc-class">${p.missionClass}</span>
                        <span class="sc-status ${p.status === 'in progress' ? 'in-progress' : 'complete'}">
                            <span class="sc-status-dot"></span>${p.status.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div class="mc-viewport" style="--mc-img: url('${p.img}');">
                    <div class="scanlines"></div>
                    <img src="${p.img}" alt="${p.name}">
                    <div class="mc-viewport-vignette"></div>
                    <span class="mc-hud-corner tl"></span>
                    <span class="mc-hud-corner tr"></span>
                    <span class="mc-hud-corner bl"></span>
                    <span class="mc-hud-corner br"></span>
                </div>

                <div class="mc-body">
                    <h3 class="mc-title">${p.name}</h3>
                    <div class="mc-payload-row">
                        <span class="mc-payload-label">PAYLOAD //</span>
                        <div class="sc-tech-pills">${toolPillsHtml}</div>
                    </div>
                    <div class="sc-brief" id="brief-${p.id}">${p.brief}</div>
                    <div class="sc-footer">
                        <div class="sc-icons">${iconsHtml}</div>
                        <div class="sc-actions">
                            ${p.preview_url ? `
                            <a href="${p.preview_url}" target="_blank" rel="noopener noreferrer" class="sc-btn">
                                <i class="fas fa-satellite-dish"></i> MISSION PREVIEW
                            </a>` : `
                            <a href="https://github.com/Bilalyzr" target="_blank" rel="noopener noreferrer" class="sc-btn sc-btn-secondary">
                                <i class="fab fa-github"></i> SOURCE ARCHIVE
                            </a>`}
                        </div>
                    </div>
                </div>
            `;

            stackContainer.appendChild(consoleCard);

            // Terminal Typing Effect for active mission brief
            setTimeout(() => {
                const briefEl = consoleCard.querySelector('.sc-brief');
                if (briefEl) {
                    const text = p.brief;
                    briefEl.textContent = '';
                    let charIndex = 0;

                    if (briefEl.typingTimeout) clearTimeout(briefEl.typingTimeout);

                    function type() {
                        if (!document.contains(briefEl)) return;
                        if (charIndex < text.length) {
                            briefEl.textContent += text.charAt(charIndex);
                            charIndex++;
                            briefEl.typingTimeout = setTimeout(type, 14);
                        }
                    }
                    type();
                }
            }, 180);
        }
    }

    function stepMission(delta) {
        const f = getFiltered(currentFilter);
        if (!f.length) return;
        activeStackIndex = (activeStackIndex + delta + f.length) % f.length;
        renderStack();
    }

    // Nav arrows
    document.getElementById('prevBtn').addEventListener('click', () => stepMission(-1));
    document.getElementById('nextBtn').addEventListener('click', () => stepMission(1));

    // Keyboard Left/Right arrow navigation when Projects section is in view or focused
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        const projectsSec = document.getElementById('projects');
        if (!projectsSec) return;
        const rect = projectsSec.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25;
        if (inView) {
            stepMission(e.key === 'ArrowRight' ? 1 : -1);
        }
    });

    // Touch-swipe navigation on stackContainer
    if (stackContainer) {
        let touchStartX = 0;
        let touchStartY = 0;
        stackContainer.addEventListener('touchstart', (e) => {
            if (!e.touches.length) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        stackContainer.addEventListener('touchend', (e) => {
            if (!e.changedTouches.length) return;
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                stepMission(dx < 0 ? 1 : -1);
            }
        }, { passive: true });
    }

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

    // --- Live Spacecraft Telemetry Footer Clock (IST) ---
    const footerClockEl = document.getElementById('footerMissionClock');
    if (footerClockEl) {
        const updateFooterClock = () => {
            const now = new Date();
            const istTime = now.toLocaleTimeString('en-GB', {
                timeZone: 'Asia/Kolkata',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            footerClockEl.textContent = `IST ${istTime}`;
        };
        updateFooterClock();
        setInterval(updateFooterClock, 1000);
    }





    // --- 6. MOBILE NAVIGATION Logic ---
    const mobileNavOverlay = document.getElementById('mobileNav');
    const mobileMenuTrigger = document.getElementById('mobileMenuTrigger');

    window.toggleMobileMenu = function () {
        if (!mobileNavOverlay) return;
        const isOpen = mobileNavOverlay.classList.toggle('active');
        if (mobileMenuTrigger) {
            mobileMenuTrigger.classList.toggle('active', isOpen);
            mobileMenuTrigger.setAttribute('aria-expanded', String(isOpen));
        }
    };

    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', (e) => {
            if (e.target === mobileNavOverlay) {
                window.toggleMobileMenu();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileNavOverlay.classList.contains('active')) {
                window.toggleMobileMenu();
            }
        });
    }

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

    if (!wrapper || !btn) return;

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
        if (planet) {
            planet.style.transform = `rotate(20deg) translate(${x * 0.1}px, ${y * 0.1}px)`;
        }
    });

    // Reset positions when mouse leaves the area
    wrapper.addEventListener('mouseleave', () => {
        btn.style.transform = 'rotateX(0) rotateY(0)';
        if (planet) {
            planet.style.transform = 'rotate(20deg) translate(0, 0)';
        }
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

    // Visibility check using IntersectionObserver
    const visObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
        });
    }, { threshold: 0.1 });
    visObserver.observe(section);

    function updateAndDraw(time) {
        if (!isVisible) {
            animationId = requestAnimationFrame(updateAndDraw);
            return;
        }

        if (canvas.width !== section.offsetWidth || canvas.height !== section.offsetHeight) {
            resizeCanvas();
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

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animationId = requestAnimationFrame(updateAndDraw);
}

document.addEventListener('DOMContentLoaded', () => {
    initWarpTrail();
});

// --- 12. SPACE PRELOADER (STARGATE HUD) SEQUENCER ---
function initSpaceLoader() {
    const loader = document.getElementById('space-loader');
    if (!loader) return;

    const percentEl = loader.querySelector('.loader-percentage');
    const telemetryEl = loader.querySelector('.loader-telemetry');
    const barFillEl = loader.querySelector('.loader-bar-fill');
    
    let currentPercent = 0;
    let isFullyLoaded = false;

    const telemetryStages = [
        { limit: 15, text: "LOCATING CELESTIAL COORDINATES..." },
        { limit: 30, text: "MAPPING PLANETARY TRAJECTORIES..." },
        { limit: 45, text: "ALIGNING ORBITAL PATHWAYS..." },
        { limit: 60, text: "ESTABLISHING STELLAR TRAJECTORY..." },
        { limit: 75, text: "APPROACHING THE SYSTEM STAR..." },
        { limit: 90, text: "SYNCHRONIZING TELEMETRY BASE..." },
        { limit: 100, text: "WELCOME TO THE UNIVERSE!" }
    ];

    let telemetryTarget = '';
    function updateTelemetry(pct) {
        const stage = telemetryStages.find(s => pct <= s.limit);
        if (stage && stage.text !== telemetryTarget) {
            telemetryTarget = stage.text;
            // Crossfade: fade out, swap text, fade back in
            telemetryEl.classList.add('swapping');
            setTimeout(() => {
                telemetryEl.textContent = telemetryTarget;
                telemetryEl.classList.remove('swapping');
            }, 180);
        }
    }

    // Block Lenis smooth scroll during preloader
    if (window.lenis) {
        window.lenis.stop();
    }
    
    // Fallback if window already loaded
    if (document.readyState === 'complete') {
        isFullyLoaded = true;
    } else {
        window.addEventListener('load', () => {
            isFullyLoaded = true;
        });
    }

    function animateProgress() {
        let increment = Math.floor(Math.random() * 3) + 1; // 1% to 3% increments
        
        // Slow down near completion (90%) if assets are still loading
        if (currentPercent >= 88 && !isFullyLoaded) {
            increment = 0.3; // Crawl forward to allow load event
        }

        currentPercent = Math.min(100, currentPercent + increment);
        
        // Print progress
        const displayVal = Math.floor(currentPercent);
        percentEl.textContent = displayVal.toString().padStart(2, '0') + '%';
        updateTelemetry(displayVal);
        
        // Dynamic bar filling
        if (barFillEl) {
            barFillEl.style.width = displayVal + '%';
        }

        if (currentPercent < 100) {
            const delay = Math.random() * 40 + 20; // 20ms to 60ms delay for natural pacing
            setTimeout(animateProgress, delay);
        } else {
            // Loader reached 100% — smooth fade-out without flash animation
            setTimeout(() => {
                loader.classList.add('loaded'); // zoom-through + fade

                // Resume Lenis smooth scroll
                if (window.lenis) {
                    window.lenis.start();
                }

                // Remove the loader once transition finishes
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 900);
            }, 300);
        }
    }

    // Start boot sequence
    setTimeout(animateProgress, 100);
}

// Run preloader immediately
initSpaceLoader();


// --- CONTACT: Transmission Console form handling ---
document.addEventListener('DOMContentLoaded', () => {
    const openTxBtn = document.getElementById('openTransmissionBtn');
    const txConsole = document.getElementById('transmissionConsole');
    const form = document.getElementById('contactForm');
    
    if (openTxBtn && txConsole) {
        openTxBtn.addEventListener('click', () => {
            const isExpanded = txConsole.classList.contains('active');

            if (!isExpanded) {
                txConsole.classList.add('active');
                openTxBtn.classList.add('active');
                const btnText = openTxBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'CLOSE TRANSMISSION';

                setTimeout(() => {
                    if (window.lenis) {
                        window.lenis.scrollTo(txConsole, { offset: -30 });
                    } else {
                        txConsole.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                    const nameEl = document.getElementById('cf-name');
                    if (nameEl) nameEl.focus({ preventScroll: true });
                }, 150);
            } else {
                txConsole.classList.remove('active');
                openTxBtn.classList.remove('active');
                const btnText = openTxBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'OPEN A TRANSMISSION';
            }
        });
    }

    if (!form) return;

    // Destination inbox. To route through a backend later (e.g. Formspree),
    // set this to your endpoint URL and the code below will POST instead of mailto.
    const RECIPIENT = 'althafbilal1968@gmail.com';
    const ENDPOINT = ''; // e.g. 'https://formspree.io/f/xxxxxxx'

    const nameEl = document.getElementById('cf-name');
    const emailEl = document.getElementById('cf-email');
    const msgEl = document.getElementById('cf-message');
    const statusEl = document.getElementById('cfStatus');
    const btn = document.getElementById('cfSubmit');
    const btnLabel = btn.querySelector('.transmit-label');

    const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    function setStatus(msg, kind) {
        statusEl.textContent = msg;
        statusEl.className = 'form-status' + (kind ? ' ' + kind : '');
    }

    function validate() {
        let ok = true;
        [[nameEl, nameEl.value.trim().length > 0],
         [emailEl, isEmail(emailEl.value.trim())],
         [msgEl, msgEl.value.trim().length > 0]].forEach(([el, valid]) => {
            el.classList.toggle('invalid', !valid);
            if (!valid) ok = false;
        });
        return ok;
    }

    // Clear the invalid state as the user corrects a field
    [nameEl, emailEl, msgEl].forEach(el =>
        el.addEventListener('input', () => el.classList.remove('invalid')));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validate()) {
            setStatus('// Signal blocked — check highlighted fields', 'err');
            return;
        }

        const data = {
            name: nameEl.value.trim(),
            email: emailEl.value.trim(),
            message: msgEl.value.trim()
        };

        btn.disabled = true;
        btnLabel.textContent = 'Transmitting…';
        setStatus('// Establishing uplink…', '');

        try {
            if (ENDPOINT) {
                const res = await fetch(ENDPOINT, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!res.ok) throw new Error('Bad response');
            } else {
                // Zero-backend fallback: open the visitor's mail client, pre-filled.
                const subject = encodeURIComponent(`New transmission from ${data.name}`);
                const body = encodeURIComponent(`${data.message}\n\n— ${data.name}\n${data.email}`);
                window.location.href = `mailto:${RECIPIENT}?subject=${subject}&body=${body}`;
            }

            btn.classList.add('sent');
            btnLabel.textContent = 'Signal Sent';
            setStatus('✓ Transmission received. I\'ll respond within orbit.', 'ok');
            form.reset();

            setTimeout(() => {
                btn.classList.remove('sent');
                btn.disabled = false;
                btnLabel.textContent = 'Transmit Message';
            }, 4000);
        } catch (err) {
            btn.disabled = false;
            btnLabel.textContent = 'Transmit Message';
            setStatus('// Uplink failed — email althafbilal1968@gmail.com directly', 'err');
        }
    });
});


// --- 13. HOLOGRAPHIC GITHUB CONTRIBUTIONS HUD (@Bilalyzr) ---
document.addEventListener('DOMContentLoaded', () => {
    const ghCard = document.getElementById('githubContactCard');
    const ghUrlTrigger = document.getElementById('githubUrlTrigger');
    const ghHud = document.getElementById('githubContribHud');
    const ghCloseBtn = document.getElementById('ghHudCloseBtn');
    const heatmapGrid = document.getElementById('ghHeatmapGrid');
    const monthsRow = document.getElementById('ghMonthsRow');
    const readoutEl = document.getElementById('ghCellReadout');
    const floatingTooltip = document.getElementById('ghFloatingTooltip');
    const totalEl = document.getElementById('ghTotalContrib');
    const reposEl = document.getElementById('ghPublicRepos');
    const peakEl = document.getElementById('ghPeakDay');
    const peakDateSubEl = document.getElementById('ghPeakDateSub');
    const activeDaysEl = document.getElementById('ghActiveDays');
    const streakSubEl = document.getElementById('ghStreakSub');

    if (!ghCard || !ghHud || !heatmapGrid) return;

    const GITHUB_USER = 'Bilalyzr';

    // Real snapshot of @Bilalyzr's active contribution dates for instant / offline rendering
    const FALLBACK_ACTIVE_MAP = {
        '2025-12-08': [5, 1],
        '2026-02-13': [1, 1], '2026-02-20': [4, 1],
        '2026-03-05': [1, 1], '2026-03-10': [4, 1],
        '2026-04-05': [1, 1], '2026-04-14': [1, 1], '2026-04-19': [2, 1], '2026-04-25': [3, 1],
        '2026-05-06': [1, 1], '2026-05-07': [7, 2], '2026-05-08': [1, 1], '2026-05-09': [1, 1],
        '2026-05-19': [17, 3], '2026-05-20': [4, 1], '2026-05-24': [1, 1], '2026-05-25': [5, 1],
        '2026-06-13': [2, 1], '2026-06-14': [2, 1], '2026-06-20': [3, 1], '2026-06-21': [3, 1],
        '2026-06-24': [3, 1], '2026-06-26': [1, 1], '2026-06-27': [1, 1], '2026-06-29': [2, 1],
        '2026-07-04': [1, 1], '2026-07-05': [4, 1], '2026-07-11': [1, 1], '2026-07-15': [3, 1],
        '2026-07-16': [2, 1], '2026-07-17': [4, 1], '2026-07-20': [1, 1], '2026-07-21': [5, 1],
        '2026-07-23': [1, 1], '2026-07-24': [1, 1], '2026-07-25': [3, 1],
        '2026-08-03': [6, 1], '2026-08-04': [1, 1], '2026-08-05': [7, 2], '2026-08-06': [1, 1],
        '2026-08-07': [1, 1], '2026-08-12': [2, 1], '2026-08-13': [1, 1], '2026-08-14': [10, 2],
        '2026-08-15': [3, 1], '2026-08-20': [6, 1], '2026-08-21': [9, 2], '2026-08-22': [2, 1],
        '2026-08-25': [9, 2], '2026-08-31': [4, 1],
        '2026-09-01': [4, 1], '2026-09-03': [2, 1], '2026-09-04': [1, 1], '2026-09-05': [9, 2],
        '2026-09-06': [16, 3], '2026-09-08': [8, 2], '2026-09-09': [1, 1], '2026-09-10': [12, 2],
        '2026-09-12': [11, 2], '2026-09-13': [1, 1], '2026-09-14': [2, 1], '2026-09-16': [2, 1],
        '2026-09-21': [3, 1], '2026-09-22': [19, 3], '2026-09-23': [4, 1], '2026-09-24': [2, 1],
        '2026-09-25': [9, 2], '2026-09-26': [5, 1], '2026-09-27': [3, 1], '2026-09-28': [3, 1],
        '2026-09-29': [4, 1], '2026-09-30': [2, 1],
        '2026-10-03': [26, 4], '2026-10-05': [5, 1], '2026-10-06': [13, 2], '2026-10-07': [3, 1],
        '2026-10-08': [1, 1], '2026-10-09': [3, 1], '2026-10-10': [6, 1], '2026-10-11': [14, 3],
        '2026-10-13': [1, 1], '2026-10-14': [2, 1], '2026-10-16': [6, 1], '2026-10-17': [5, 1]
    };

    function buildFallbackContributions() {
        const list = [];
        const start = new Date('2025-10-12T00:00:00Z');
        const end = new Date('2026-10-17T00:00:00Z');
        for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
            const iso = d.toISOString().slice(0, 10);
            const hit = FALLBACK_ACTIVE_MAP[iso];
            list.push({
                date: iso,
                count: hit ? hit[0] : 0,
                level: hit ? hit[1] : 0
            });
        }
        return list;
    }

    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function formatReadoutDate(isoDate) {
        const parts = isoDate.split('-');
        if (parts.length !== 3) return isoDate;
        const m = MONTH_NAMES[parseInt(parts[1], 10) - 1] || parts[1];
        return `${m} ${parseInt(parts[2], 10)}, ${parts[0]}`;
    }

    // Theme switcher buttons (GitHub Neon Green vs Cosmic Cyan)
    ghHud.querySelectorAll('.gh-theme-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const theme = btn.getAttribute('data-theme-target') || 'emerald';
            ghHud.setAttribute('data-theme', theme);
            ghHud.querySelectorAll('.gh-theme-btn').forEach(b => b.classList.toggle('active', b === btn));
        });
    });

    function renderContributions(contributions, totalOverride) {
        if (!Array.isArray(contributions) || contributions.length === 0) return;

        heatmapGrid.innerHTML = '';
        if (monthsRow) monthsRow.innerHTML = '';

        let total = typeof totalOverride === 'number' ? totalOverride : 0;
        let peakCount = 0;
        let peakDate = '';
        let activeDays = 0;
        let currentStreak = 0;
        let maxStreak = 0;

        const totalWeeks = Math.ceil(contributions.length / 7);
        heatmapGrid.style.setProperty('--total-weeks', totalWeeks);

        const monthMarkers = [];
        let lastMonth = -1;
        let lastMarkerWeek = -10;

        contributions.forEach((day, idx) => {
            if (typeof totalOverride !== 'number') total += day.count;
            if (day.count > 0) {
                activeDays++;
                currentStreak++;
                if (currentStreak > maxStreak) maxStreak = currentStreak;
            } else {
                currentStreak = 0;
            }

            if (day.count > peakCount) {
                peakCount = day.count;
                peakDate = day.date;
            }

            const weekIdx = Math.floor(idx / 7);
            if (idx % 7 === 0 && day.date) {
                const mIdx = parseInt(day.date.slice(5, 7), 10) - 1;
                if (mIdx !== lastMonth && mIdx >= 0 && mIdx < 12) {
                    if (weekIdx - lastMarkerWeek >= 3 && weekIdx < totalWeeks - 1) {
                        monthMarkers.push({ weekIdx, label: MONTH_NAMES[mIdx] });
                        lastMarkerWeek = weekIdx;
                    }
                    lastMonth = mIdx;
                }
            }

            const cell = document.createElement('div');
            const lvl = Math.min(4, Math.max(0, day.level || 0));
            cell.className = `gh-cell lvl-${lvl}`;
            cell.dataset.date = day.date;
            cell.dataset.count = day.count;

            const showCellInfo = () => {
                const readableDate = formatReadoutDate(day.date);
                if (readoutEl) {
                    const label = day.count === 0
                        ? `0 CONTRIBUTIONS ON ${readableDate.toUpperCase()}`
                        : `${day.count} CONTRIBUTION${day.count > 1 ? 'S' : ''} ON ${readableDate.toUpperCase()}`;
                    readoutEl.innerHTML = `<span class="readout-pulse"></span><span class="readout-text" style="color:${day.count > 0 ? 'var(--gh-accent)' : 'rgba(240,246,252,0.75)'};">${label}</span>`;
                }

                if (floatingTooltip) {
                    const hudRect = ghHud.getBoundingClientRect();
                    const cellRect = cell.getBoundingClientRect();
                    const leftPx = cellRect.left - hudRect.left + (cellRect.width / 2);
                    const topPx = cellRect.top - hudRect.top;

                    const clampedLeft = Math.max(90, Math.min(hudRect.width - 90, leftPx));
                    floatingTooltip.style.left = `${clampedLeft}px`;
                    floatingTooltip.style.top = `${topPx}px`;
                    floatingTooltip.innerHTML = day.count === 0
                        ? `No contributions on ${readableDate}`
                        : `<strong>${day.count} contribution${day.count > 1 ? 's' : ''}</strong> on ${readableDate}`;
                    floatingTooltip.classList.add('visible');
                }
            };

            const hideCellInfo = () => {
                if (floatingTooltip) {
                    floatingTooltip.classList.remove('visible');
                }
            };

            cell.addEventListener('mouseenter', showCellInfo);
            cell.addEventListener('mouseleave', hideCellInfo);
            cell.addEventListener('touchstart', showCellInfo, { passive: true });

            heatmapGrid.appendChild(cell);
        });

        if (monthsRow) {
            monthMarkers.forEach(({ weekIdx, label }) => {
                const span = document.createElement('span');
                span.textContent = label;
                span.style.left = `${(weekIdx / totalWeeks) * 100}%`;
                monthsRow.appendChild(span);
            });
        }

        if (totalEl) totalEl.textContent = total.toLocaleString();
        if (peakEl) peakEl.textContent = peakCount;
        if (peakDateSubEl && peakDate) peakDateSubEl.textContent = formatReadoutDate(peakDate);
        if (activeDaysEl) activeDaysEl.textContent = activeDays;
        if (streakSubEl) streakSubEl.textContent = `Max Streak: ${maxStreak}d`;

        // Scroll heatmap to most recent weeks on small screens
        const scrollBox = ghHud.querySelector('.gh-heatmap-scroll');
        if (scrollBox && window.innerWidth <= 900) {
            scrollBox.scrollLeft = scrollBox.scrollWidth;
        }
    }

    // 1. Render immediately with verified snapshot so there is zero blank state
    renderContributions(buildFallbackContributions(), 372);

    // 2. Fetch live GitHub telemetry in background
    let hasFetchedLive = false;
    async function fetchLiveGitHubTelemetry() {
        if (hasFetchedLive) return;
        hasFetchedLive = true;

        try {
            const [contribRes, userRes] = await Promise.allSettled([
                fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`),
                fetch(`https://api.github.com/users/${GITHUB_USER}`)
            ]);

            if (contribRes.status === 'fulfilled' && contribRes.value.ok) {
                const contribData = await contribRes.value.json();
                if (contribData && Array.isArray(contribData.contributions)) {
                    const lastYrTotal = contribData.total && typeof contribData.total.lastYear === 'number'
                        ? contribData.total.lastYear
                        : undefined;
                    renderContributions(contribData.contributions, lastYrTotal);
                }
            }

            if (userRes.status === 'fulfilled' && userRes.value.ok) {
                const userData = await userRes.value.json();
                if (userData) {
                    if (typeof userData.public_repos === 'number' && reposEl) {
                        reposEl.textContent = userData.public_repos;
                    }
                    const avatarImg = document.getElementById('ghAvatar');
                    if (userData.avatar_url && avatarImg) {
                        avatarImg.src = userData.avatar_url;
                    }
                }
            }
        } catch (err) {
            // Snapshot is already rendered, fail silently
        }
    }

    // --- Hover & Touch / Click State Machine ---
    let isPinned = false;
    let hoverTimer = null;

    function openHud(pin = false) {
        clearTimeout(hoverTimer);
        if (pin) isPinned = true;
        ghHud.classList.add('active');
        ghCard.classList.add('hud-open');
        ghCard.setAttribute('aria-expanded', 'true');
        fetchLiveGitHubTelemetry();
    }

    function closeHud(force = false) {
        if (isPinned && !force) return;
        isPinned = false;
        ghHud.classList.remove('active');
        ghCard.classList.remove('hud-open');
        ghCard.setAttribute('aria-expanded', 'false');
        if (floatingTooltip) floatingTooltip.classList.remove('visible');
    }

    function scheduleClose() {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
            closeHud(false);
        }, 220);
    }

    // Desktop Hover on GitHub Card & HUD
    ghCard.addEventListener('mouseenter', () => openHud(false));
    ghCard.addEventListener('mouseleave', scheduleClose);
    ghHud.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
    ghHud.addEventListener('mouseleave', scheduleClose);

    // Touch / Click on GitHub Card or URL displays contributions on the portfolio
    ghCard.addEventListener('click', (e) => {
        e.preventDefault();
        if (ghHud.classList.contains('active') && isPinned) {
            closeHud(true);
        } else {
            openHud(true);
            setTimeout(() => {
                if (window.innerWidth <= 900) {
                    ghHud.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 200);
        }
    });

    if (ghUrlTrigger) {
        ghUrlTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (ghHud.classList.contains('active') && isPinned) {
                closeHud(true);
            } else {
                openHud(true);
            }
        });
    }

    // Keyboard accessibility on GitHub Card
    ghCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (ghHud.classList.contains('active')) {
                closeHud(true);
            } else {
                openHud(true);
            }
        }
    });

    // Close button inside HUD
    if (ghCloseBtn) {
        ghCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeHud(true);
        });
    }

    // Click outside or Escape key unpins and closes HUD
    document.addEventListener('click', (e) => {
        if (!ghHud.classList.contains('active')) return;
        if (!ghHud.contains(e.target) && !ghCard.contains(e.target)) {
            closeHud(true);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && ghHud.classList.contains('active')) {
            closeHud(true);
        }
    });
});




