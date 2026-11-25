document.addEventListener('DOMContentLoaded', () => {

    // --- Accessibility: honor the user's reduced-motion preference ---
    const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- 0. LENIS SMOOTH SCROLL INIT ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
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
    // Expose lenis globally if needed
    window.lenis = lenis;

    // --- 1. GLOBAL: Scroll Spy & Smooth Scroll ---
    const sections = document.querySelectorAll('section');
    const scrollLinks = document.querySelectorAll('.scroll-nav li');
    const scrollNavBox = document.querySelector('.scroll-nav');
    const scrollLabel = document.getElementById('scrollLabel');

    let lastScrollTop = 0;
    let isScrolling = false;
    let currentActiveIndex = 0;
    let labelAtBottom = null;

    // Single persistent click listener on #scrollLabel (avoids rewriting DOM & losing clicks mid-scroll)
    if (scrollLabel) {
        scrollLabel.addEventListener('click', () => {
            if (currentActiveIndex >= sections.length - 1) {
                lenis.scrollTo('#home');
            } else {
                const nextSection = sections[currentActiveIndex + 1];
                if (nextSection) {
                    lenis.scrollTo(nextSection);
                }
            }
        });
    }

    function updateActiveScroll() {
        const st = window.pageYOffset || document.documentElement.scrollTop;
        const triggerY = window.innerHeight * 0.38;

        // Detect Scroll Direction for Rocket Orientation & Thruster Trail
        if (st <= 10) {
            document.body.classList.add('scroll-down');
            document.body.classList.remove('scroll-up');
        } else if (st > lastScrollTop + 1) {
            if (!document.body.classList.contains('scroll-down')) {
                document.body.classList.add('scroll-down');
                document.body.classList.remove('scroll-up');
            }
        } else if (st < lastScrollTop - 1) {
            if (!document.body.classList.contains('scroll-up')) {
                document.body.classList.add('scroll-up');
                document.body.classList.remove('scroll-down');
            }
        }
        lastScrollTop = st <= 0 ? 0 : st;

        // Determine active section accurately using live viewport coordinates
        let current = '#' + (sections[0] ? sections[0].getAttribute('id') : 'home');
        for (let i = 0; i < sections.length; i++) {
            const rect = sections[i].getBoundingClientRect();
            if (rect.top <= triggerY) {
                current = '#' + sections[i].getAttribute('id');
            }
        }

        let activeIndex = -1;
        scrollLinks.forEach((link, index) => {
            link.classList.remove('active');
            if (link.dataset.target === current) {
                link.classList.add('active');
                activeIndex = index;
            }
        });

        // Sync Mobile Orbital Navigation Deck active indicator
        document.querySelectorAll('.mobile-nav-links .mnav-item').forEach((mItem) => {
            mItem.classList.toggle('active', mItem.getAttribute('href') === current);
        });

        // Add 'passedSection' class and update rocket indicator position
        if (activeIndex !== -1) {
            currentActiveIndex = activeIndex;

            // At final section (#contact), point rocket upward ready for return flight
            if (activeIndex === sections.length - 1) {
                document.body.classList.add('scroll-up');
                document.body.classList.remove('scroll-down');
            }

            scrollLinks.forEach((link, index) => {
                if (index < activeIndex) {
                    link.classList.add('passedSection');
                } else {
                    link.classList.remove('passedSection');
                }
            });

            // Position the Rocket & Progress Line at the exact vertical midpoint of the active waypoint
            const activeLink = scrollLinks[activeIndex];
            if (scrollNavBox && activeLink) {
                const centerPos = activeLink.offsetTop + activeLink.offsetHeight / 2;
                scrollNavBox.style.setProperty('--active-pos', `${centerPos}px`);
            }

            // Update Scroll Down / Back to Top label only when state changes
            const isAtLast = activeIndex === sections.length - 1;
            if (scrollLabel && labelAtBottom !== isAtLast) {
                labelAtBottom = isAtLast;
                if (isAtLast) {
                    scrollLabel.innerHTML = '<i class="fas fa-chevron-up"></i><span>Back To Top</span>';
                } else {
                    scrollLabel.innerHTML = '<span>Scroll Down</span><i class="fas fa-chevron-down"></i>';
                }
            }
        }

        isScrolling = false;
    }

    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(updateActiveScroll);
            isScrolling = true;
        }
    }, { passive: true });

    window.addEventListener('resize', () => {
        window.requestAnimationFrame(updateActiveScroll);
    });

    // Trigger once on load to set initial state
    updateActiveScroll();

    // Select all navigation links (Sidebar + Brand Logo + Top Contact + CTA Buttons + Skill CTA + Mobile Nav)
    const allNavLinks = document.querySelectorAll('.scroll-nav li, .brand-logo, .nav-contact-btn, .cta-btn, .space-button, .skill-cta-btn, .mobile-nav-links a');
    const warpOverlay = document.getElementById('warp-transition');

    allNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Get target from data-target (sidebar) or href (standard links)
            const targetId = link.dataset.target || link.getAttribute('href');

            // Only intercept internal hash links
            if (targetId && targetId.startsWith('#') && document.querySelector(targetId)) {
                e.preventDefault();

                // Close mobile menu if open
                const mobileNav = document.getElementById('mobileNav');
                const mobileTrigger = document.getElementById('mobileMenuTrigger');
                if (mobileNav && mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
                    if (mobileTrigger) {
                        mobileTrigger.classList.remove('active');
                        mobileTrigger.setAttribute('aria-expanded', 'false');
                    }
                }

                // Trigger Warp Speed Effect (skip if user prefers reduced motion)
                if (warpOverlay && !REDUCE_MOTION) {
                    warpOverlay.classList.add('active');

                    // Wait for warp buildup, then teleport (scroll)
                    setTimeout(() => {
                        lenis.scrollTo(targetId, { immediate: true }); // Instant jump masked by flash
                    }, 400);

                    // Clean up overlay after animation finishes
                    setTimeout(() => {
                        warpOverlay.classList.remove('active');
                    }, 1200);
                } else {
                    // Fallback / reduced-motion smooth scroll
                    lenis.scrollTo(targetId, { immediate: REDUCE_MOTION });
                }
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

                observer.unobserve(entry.target);
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
    // threads drawn once (and on significant viewport resize) for a deep space backdrop.
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

        // Pre-generate normalized star positions once so browser zoom / resize never randomizes or flashes the starfield
        const STAR_POOL = Array.from({ length: 240 }, () => {
            const depth = Math.random();
            return {
                nx: Math.random(),
                ny: Math.random(),
                size: 0.5 + depth * 1.45,
                alpha: 0.25 + depth * 0.58,
                tint: STAR_TINTS[(Math.random() * STAR_TINTS.length) | 0]
            };
        });

        let lastStarW = 0;
        let lastStarH = 0;
        let lastDPR = 0;
        let starRafId = null;

        function draw() {
            starRafId = null;
            const W = window.innerWidth;
            const H = window.innerHeight;
            const DPR = Math.min(window.devicePixelRatio || 1, 2);
            lastStarW = W;
            lastStarH = H;
            lastDPR = DPR;

            canvas.width = W * DPR;
            canvas.height = H * DPR;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            ctx.clearRect(0, 0, W, H);

            const count = Math.min(240, Math.max(90, Math.round((W * H) / 8500)));

            for (let i = 0; i < count; i++) {
                const s = STAR_POOL[i];
                const x = s.nx * W;
                const y = s.ny * H;

                ctx.fillStyle = s.tint + s.alpha + ')';
                ctx.beginPath();
                ctx.arc(x, y, s.size, 0, Math.PI * 2);
                ctx.fill();

                if (s.size > 1.4) {
                    ctx.fillStyle = s.tint + (s.alpha * 0.14) + ')';
                    ctx.beginPath();
                    ctx.arc(x, y, s.size * 2.8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        draw();

        let resizeTimer;
        window.addEventListener('resize', () => {
            const currentDPR = Math.min(window.devicePixelRatio || 1, 2);
            if (
                Math.abs(window.innerWidth - lastStarW) < 2 &&
                Math.abs(window.innerHeight - lastStarH) < 140 &&
                Math.abs(currentDPR - lastDPR) < 0.05
            ) {
                return;
            }
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (!starRafId) {
                    starRafId = requestAnimationFrame(draw);
                }
            }, 120);
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
    let skillProgressTimer = null;

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
            planetNameEl.textContent = data.planet || 'SECTOR // ORBIT';
        }

        const titleEl = document.getElementById('skill-title');
        if (titleEl) titleEl.textContent = data.title;

        const toolsContainer = document.getElementById('skill-tools');
        if (toolsContainer) {
            toolsContainer.textContent = '';
            data.tools.split(',').forEach(t => {
                const pill = document.createElement('span');
                pill.className = 'sk-tool-pill';
                pill.textContent = t.trim();
                toolsContainer.appendChild(pill);
            });
        }

        const levelEl = document.getElementById('skill-level');
        if (levelEl) levelEl.textContent = data.level;
        const percentEl = document.getElementById('skill-percent');
        if (percentEl) percentEl.textContent = data.percent;
        const descEl = document.getElementById('skill-desc');
        if (descEl) descEl.textContent = data.desc;

        const skillProgress = document.getElementById('skill-progress');
        if (skillProgress) {
            clearTimeout(skillProgressTimer);
            // Reset width to 0 first to re-trigger animation
            skillProgress.style.width = '0%';
            skillProgressTimer = setTimeout(() => {
                skillProgress.style.width = data.percent;
            }, 260);
        }

        skillCard.classList.add('open');
        if (universeContainer) universeContainer.classList.add('paused-orbit');
    };

    window.closeSkillCard = function () {
        if (!skillCard) return;
        clearTimeout(skillProgressTimer);
        skillCard.classList.remove('open');
        if (universeContainer) universeContainer.classList.remove('paused-orbit');
    };

    // Keyboard operability for #skills 3D planets & Escape key to close telemetry dossier
    document.querySelectorAll('#skills .planet[data-skill]').forEach((planetEl) => {
        planetEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const skillKey = planetEl.getAttribute('data-skill');
                if (skillKey) window.openSkill(skillKey);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && skillCard && skillCard.classList.contains('open')) {
            window.closeSkillCard();
        }
    });

    // Ensure Uranus & Jupiter have no ring elements even in cached sessions
    document.querySelectorAll(
        '.ring-jupiter-faint, .ring-uranus, .sk-uranus-ring, .sk-jupiter-ring, .planet-jupiter .planet-ring, .planet-uranus .planet-ring'
    ).forEach((ringEl) => ringEl.remove());

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
            name: "Sashainfinity E-Learning platform",
            tools: "React.js, WordPress, Tutor LMS, AI Integration",
            category: ["web", "react"],
            missionClass: "ORBITAL",
            status: "complete",
            icon: ["fab fa-react", "fab fa-wordpress"],
            brief: "Developed and maintained a Tutor LMS-based e-learning platform supporting online course delivery, WordPress performance optimization, and AI tool integrations.",
            img: "assets/images/tutor_lms.png",
            preview_url: "https://sashainfinity.com/"
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
        },
        {
            id: 9,
            codename: "INDIA-09",
            sector: "SECTOR ι-09 · KEPLER NEXUS",
            planetTex: "assets/images/planets/earth.jpg",
            accent: "#22d3ee",
            name: "Sileos — Knowledge Architecture & Interactive Labs",
            tools: "React, TypeScript, Vite, PostCSS, Tailwind CSS, tailwindcss-animate",
            category: ["react", "web"],
            missionClass: "ORBITAL",
            status: "complete",
            icon: ["fab fa-react", "fas fa-code", "fas fa-bolt", "fas fa-wind"],
            brief: "Built a responsive knowledge architecture web platform delivering interactive learning labs, structured courses, and seamless multi-device experiences.",
            img: "assets/images/sileos.jpg",
            preview_url: "https://sileos.sashainfinity.com/"
        },
        {
            id: 10,
            codename: "JULIET-10",
            sector: "SECTOR κ-10 · LUNA SYNTH",
            planetTex: "assets/images/planets/uranus.jpg",
            accent: "#a855f7",
            name: "Learn With Sasha — AI Personalized Math Tutor",
            tools: "React, TypeScript, Vite, Tailwind CSS, Node.js",
            category: ["react", "ai"],
            missionClass: "SYNTH",
            status: "complete",
            icon: ["fab fa-react", "fas fa-code", "fas fa-bolt", "fas fa-wind", "fab fa-node-js"],
            brief: "Contributed to an AI-powered personalized math learning platform with a 3D interactive tutor that adapts lessons to student interests and solves problems step-by-step.",
            img: "assets/images/learn_with_sasha.jpg",
            preview_url: "https://learn.sashainfinity.com/"
        }
    ];

    // --- Wide 3D Galactic Showcase Carousel ---
    const stackContainer = document.getElementById('stackContainer');
    const dotsContainer = document.getElementById('navDots');
    const missionCounterEl = document.getElementById('missionCounter');
    let activeStackIndex = 0;

    function getFiltered(category) {
        return category === 'all' ? projects : projects.filter(p => p.category.includes(category));
    }

    let currentFilter = 'all';
    let renderedFilter = null;
    let cardElements = [];

    function getCarouselPosition(index, activeIndex, total) {
        if (total <= 1) return 'center';
        if (total === 2) return index === activeIndex ? 'center' : 'next';

        const diff = (index - activeIndex + total) % total;
        if (diff === 0) return 'center';
        if (diff === 1) return 'next';
        if (diff === total - 1) return 'prev';
        return diff <= total / 2 ? 'hidden-right' : 'hidden-left';
    }

    function updateCarouselPositions() {
        const filtered = getFiltered(currentFilter);
        const total = filtered.length;
        if (!total || !stackContainer || !dotsContainer) return;
        if (activeStackIndex >= total) activeStackIndex = 0;

        cardElements.forEach((card, i) => {
            const pos = getCarouselPosition(i, activeStackIndex, total);
            card.dataset.pos = pos;
            card.setAttribute('aria-hidden', pos !== 'center' ? 'true' : 'false');

            // Only allow focus on interactive buttons inside the active center card
            card.querySelectorAll('a, button').forEach(ctrl => {
                ctrl.tabIndex = pos === 'center' ? 0 : -1;
            });
        });

        // Update nav dots
        dotsContainer.querySelectorAll('.nav-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === activeStackIndex);
        });

        // Update mission counter (e.g., 01 / 08)
        if (missionCounterEl) {
            const cur = String(activeStackIndex + 1).padStart(2, '0');
            const tot = String(total).padStart(2, '0');
            missionCounterEl.textContent = `${cur} / ${tot}`;
        }
    }

    function renderStack() {
        const filtered = getFiltered(currentFilter);
        if (!filtered.length || !stackContainer || !dotsContainer) return;
        if (activeStackIndex >= filtered.length) activeStackIndex = 0;

        // If same filter is already mounted, smoothly transition positions without rebuilding DOM
        if (renderedFilter === currentFilter && cardElements.length === filtered.length) {
            updateCarouselPositions();
            return;
        }

        function sanitizeHttpsUrl(rawUrl) {
            if (typeof rawUrl !== 'string' || !rawUrl.trim()) return '';
            try {
                const parsed = new URL(rawUrl, window.location.origin);
                return parsed.protocol === 'https:' ? parsed.href : '';
            } catch (_) {
                return '';
            }
        }

        renderedFilter = currentFilter;
        stackContainer.textContent = '';
        dotsContainer.textContent = '';
        cardElements = [];

        filtered.forEach((p, i) => {
            const card = document.createElement('article');
            card.className = 'mission-carousel-card';
            card.style.setProperty('--card-accent', p.accent || '#00e0ff');

            const hudGrid = document.createElement('div');
            hudGrid.className = 'mc-hud-grid';
            hudGrid.setAttribute('aria-hidden', 'true');
            card.appendChild(hudGrid);

            ['tl', 'tr', 'bl', 'br'].forEach(pos => {
                const corner = document.createElement('span');
                corner.className = `mc-corner ${pos}`;
                corner.setAttribute('aria-hidden', 'true');
                card.appendChild(corner);
            });

            const split = document.createElement('div');
            split.className = 'mc-split-layout';

            // Left Viewport
            const viewport = document.createElement('div');
            viewport.className = 'mc-viewport';
            viewport.style.setProperty('--mc-img', `url('${p.img}')`);

            const scanlines = document.createElement('div');
            scanlines.className = 'scanlines';
            scanlines.setAttribute('aria-hidden', 'true');
            viewport.appendChild(scanlines);

            const imgEl = document.createElement('img');
            imgEl.src = p.img;
            imgEl.alt = p.name;
            imgEl.loading = 'lazy';
            viewport.appendChild(imgEl);

            const vignette = document.createElement('div');
            vignette.className = 'mc-viewport-vignette';
            vignette.setAttribute('aria-hidden', 'true');
            viewport.appendChild(vignette);

            ['tl', 'tr', 'bl', 'br'].forEach(pos => {
                const corner = document.createElement('span');
                corner.className = `mc-hud-corner ${pos}`;
                corner.setAttribute('aria-hidden', 'true');
                viewport.appendChild(corner);
            });

            const sectorChip = document.createElement('div');
            sectorChip.className = 'mc-sector-chip';
            const planetOrb = document.createElement('span');
            planetOrb.className = 'sc-planet-orb';
            planetOrb.style.backgroundImage = `url('${p.planetTex}')`;
            const codeSpan = document.createElement('span');
            codeSpan.textContent = p.codename;
            sectorChip.appendChild(planetOrb);
            sectorChip.appendChild(codeSpan);
            viewport.appendChild(sectorChip);

            // Right Dossier
            const dossier = document.createElement('div');
            dossier.className = 'mc-dossier';

            const topbar = document.createElement('div');
            topbar.className = 'mc-topbar';
            const sectorLabel = document.createElement('span');
            sectorLabel.className = 'mc-sector';
            sectorLabel.textContent = p.sector;
            const topbarRight = document.createElement('div');
            topbarRight.className = 'mc-topbar-right';
            const classSpan = document.createElement('span');
            classSpan.className = 'sc-class';
            classSpan.textContent = p.missionClass;
            const statusSpan = document.createElement('span');
            statusSpan.className = `sc-status ${p.status === 'in progress' ? 'in-progress' : 'complete'}`;
            const statusDot = document.createElement('span');
            statusDot.className = 'sc-status-dot';
            statusSpan.appendChild(statusDot);
            statusSpan.appendChild(document.createTextNode(p.status.toUpperCase()));
            topbarRight.appendChild(classSpan);
            topbarRight.appendChild(statusSpan);
            topbar.appendChild(sectorLabel);
            topbar.appendChild(topbarRight);

            const titleEl = document.createElement('h3');
            titleEl.className = 'mc-title';
            titleEl.textContent = p.name;

            const payloadRow = document.createElement('div');
            payloadRow.className = 'mc-payload-row';
            const payloadLabel = document.createElement('span');
            payloadLabel.className = 'mc-payload-label';
            payloadLabel.textContent = 'PAYLOAD //';
            const pillsWrap = document.createElement('div');
            pillsWrap.className = 'sc-tech-pills';
            p.tools.split(',').forEach(t => {
                const pill = document.createElement('span');
                pill.className = 'sc-tech-pill';
                pill.textContent = t.trim();
                pillsWrap.appendChild(pill);
            });
            payloadRow.appendChild(payloadLabel);
            payloadRow.appendChild(pillsWrap);

            const briefEl = document.createElement('p');
            briefEl.className = 'sc-brief';
            briefEl.textContent = p.brief;

            const footer = document.createElement('div');
            footer.className = 'sc-footer';
            const iconsWrap = document.createElement('div');
            iconsWrap.className = 'sc-icons';
            iconsWrap.setAttribute('aria-hidden', 'true');
            p.icon.forEach(ic => {
                const iconNode = document.createElement('i');
                iconNode.className = ic;
                iconsWrap.appendChild(iconNode);
            });
            footer.appendChild(iconsWrap);

            const safePreviewUrl = sanitizeHttpsUrl(p.preview_url);
            if (safePreviewUrl) {
                const actionsWrap = document.createElement('div');
                actionsWrap.className = 'sc-actions';
                const link = document.createElement('a');
                link.href = safePreviewUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'sc-btn';
                const dishIcon = document.createElement('i');
                dishIcon.className = 'fas fa-satellite-dish';
                link.appendChild(dishIcon);
                link.appendChild(document.createTextNode(' MISSION PREVIEW'));
                actionsWrap.appendChild(link);
                footer.appendChild(actionsWrap);
            } else {
                const archived = document.createElement('span');
                archived.className = 'mc-archived-tag';
                const shieldIcon = document.createElement('i');
                shieldIcon.className = 'fas fa-shield-halved';
                archived.appendChild(shieldIcon);
                archived.appendChild(document.createTextNode(' INTERNAL MISSION LOG'));
                footer.appendChild(archived);
            }

            dossier.appendChild(topbar);
            dossier.appendChild(titleEl);
            dossier.appendChild(payloadRow);
            dossier.appendChild(briefEl);
            dossier.appendChild(footer);

            split.appendChild(viewport);
            split.appendChild(dossier);
            card.appendChild(split);

            // Clicking a flanking card rotates it into center focus
            card.addEventListener('click', (e) => {
                const pos = card.dataset.pos;
                if (pos === 'prev' || pos === 'next') {
                    e.preventDefault();
                    e.stopPropagation();
                    activeStackIndex = i;
                    updateCarouselPositions();
                }
            });

            stackContainer.appendChild(card);
            cardElements.push(card);

            // Indicator Dot
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'nav-dot';
            dot.style.setProperty('--dot-accent', p.accent || '#00e0ff');
            dot.title = `${p.codename} — ${p.name}`;
            dot.setAttribute('aria-label', `Select mission ${p.codename}: ${p.name}`);
            dot.addEventListener('click', () => {
                activeStackIndex = i;
                updateCarouselPositions();
            });
            dotsContainer.appendChild(dot);
        });

        updateCarouselPositions();
    }

    function stepMission(delta) {
        const f = getFiltered(currentFilter);
        if (!f.length) return;
        activeStackIndex = (activeStackIndex + delta + f.length) % f.length;
        updateCarouselPositions();
    }

    // Nav arrows
    const prevBtnEl = document.getElementById('prevBtn');
    const nextBtnEl = document.getElementById('nextBtn');
    if (prevBtnEl) {
        prevBtnEl.addEventListener('click', () => stepMission(-1));
    }
    if (nextBtnEl) {
        nextBtnEl.addEventListener('click', () => stepMission(1));
    }

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
        if (btn) btn.classList.add('active');
        currentFilter = category;
        activeStackIndex = 0;
        renderStack();
    };

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

    // --- 7. INTERACTIVE HEADINGS (EXACT DVLPR.PRO RUBBERBAND FONT INTERACTION) ---
    function bindDvlprInteractiveHeading(el) {
        if (!el || el.dataset.dvlprSplit === 'true') return;
        el.dataset.dvlprSplit = 'true';

        const nodes = Array.from(el.childNodes);
        el.innerHTML = '';

        nodes.forEach(node => {
            if (node.nodeType === 3) { // Text Node
                const tokens = node.textContent.split(/(\s+)/);
                tokens.forEach(token => {
                    if (!token) return;
                    if (/^\s+$/.test(token)) {
                        el.appendChild(document.createTextNode(' '));
                    } else {
                        const wordWrap = document.createElement('span');
                        wordWrap.className = 'interactive-word';
                        for (const char of token) {
                            const span = document.createElement('span');
                            span.className = 'interactive-letter';
                            span.textContent = char;
                            span.addEventListener('mouseenter', () => {
                                span.classList.remove('rubberBand');
                                void span.offsetWidth; // Force reflow so rubberBand restarts cleanly on rapid re-hover
                                span.classList.add('rubberBand');
                            });
                            span.addEventListener('animationend', () => {
                                span.classList.remove('rubberBand');
                            });
                            wordWrap.appendChild(span);
                        }
                        el.appendChild(wordWrap);
                    }
                });
            } else {
                el.appendChild(node.cloneNode(true)); // Preserve <br> and other elements
            }
        });
    }

    const interactiveTargets = document.querySelectorAll('.hero-role, .section-title, .skills-heading, #about .profile-card h3');
    interactiveTargets.forEach(bindDvlprInteractiveHeading);

    // --- 7B. ORBITAL AI ASSISTANT (ASTRA // GROUNDED BILAL TELEMETRY) ---
    (function initOrbitalAiChatbot() {
        const launcher = document.getElementById('aiChatLauncher');
        const backdrop = document.getElementById('aiChatBackdrop');
        const panel = document.getElementById('aiChatPanel');
        const closeBtn = document.getElementById('aiChatClose');
        const clearBtn = document.getElementById('aiChatClear');
        const messagesEl = document.getElementById('aiChatMessages');
        const form = document.getElementById('aiChatForm');
        const input = document.getElementById('aiChatInput');
        const quickPromptsEl = document.getElementById('aiQuickPrompts');

        if (!launcher || !panel || !messagesEl || !form || !input) return;

        // Optional external serverless LLM proxy URL (leave empty to use built-in grounded knowledge engine)
        const AI_ENDPOINT = '';

        const BILAL_DATA = {
            name: 'Mohammed Bilal A',
            role: 'Software Developer',
            location: 'Salem, Tamil Nadu, India (11.6643° N, 78.1460° E)',
            email: 'althafbilal1968@gmail.com',
            phone: '+91 96550 86486',
            github: 'https://github.com/Bilalyzr',
            linkedin: 'https://www.linkedin.com/in/mohammed-bilal-a-5b5656254',
            instagram: 'https://www.instagram.com/_.bxnny_4?igsh=dndpNm1zdHIxMTE0',
            resumeUrl: 'assets/Mohammed_Bilal_A_Resume.pdf',
            summary: 'Software Developer with hands-on experience in full-stack web development (React.js, Node.js, Python, WordPress), API integration, database design, Docker deployment, e-learning platforms, and AI/ML-driven applications.',
            internship: {
                role: 'Web Developer Intern',
                company: 'Sasha Infinity',
                period: 'Jun 2025 – Present',
                url: 'https://sashainfinity.com/',
                responsibilities: [
                    'Analyzed business requirements and SaaS product models to support product evaluation, implementation, and responsive web development.',
                    'Designed and developed fully responsive websites for Sasha Infinity and Sileos across desktop, tablet, and mobile devices.',
                    'Contributed to Learn With Sasha (AI-powered personalized learning platform) while managing company web platforms, monitoring performance, and shipping enhancements.'
                ],
                highlights: [
                    'Sasha Infinity (sashainfinity.com) — Technology learning platform offering expert-led courses in full-stack dev, AI, and cloud.',
                    'Sileos (sileos.sashainfinity.com) — Knowledge architecture platform delivering interactive labs and structured tech courses (React, TypeScript, Vite, PostCSS, Tailwind CSS).',
                    'Learn With Sasha (learn.sashainfinity.com) — AI math tutor personalizing lessons to student interests with conversational step-by-step solving (React, TypeScript, Vite, Tailwind CSS, Node.js).'
                ]
            },
            education: [
                'MCA (Master of Computer Applications) — Sona College of Technology · CGPA: 8.3/10 · Expected 2027 (Active)',
                'BCA (Bachelor of Computer Applications) — Sona College of Arts & Science · CGPA: 7.9/10 · Graduated May 2025',
                "HSC (Computer Applications) — St. John's Matric. Hr. Sec. School (2022)",
                "SSLC — St. John's Matric. Hr. Sec. School (2020)"
            ],
            hackathons: [
                'Winner — SIF Pitch Fest 2026',
                'Runner-up — Zen Code 26',
                'Finalist — SDG Hackathon 2026',
                'Internal Round Qualifier — Smart India Hackathon (SIH) 2025',
                'Top 500 — Niral Thiruvizha 3.0',
                'Participant — SIH 2024 & 2022'
            ],
            certifications: [
                'NPTEL Java (Elite + Gold)',
                'Full-Stack Web Development Bootcamp',
                'Cybersecurity & Ethical Hacking',
                'Ignite Bootcamp — Venture Idea Development',
                'UiPath RPA Citizen Developer Foundation',
                'Power BI Workshop',
                'Cloud and Virtualization'
            ],
            extraSkills: {
                typescript: 'TypeScript — Used with React, Vite, and Tailwind CSS in Sileos and Learn With Sasha.',
                tailwind: 'Tailwind CSS & tailwindcss-animate — Used for responsive UI styling in Sileos and Learn With Sasha.',
                vite: 'Vite & PostCSS — Used as the frontend build toolchain for Sileos and Learn With Sasha.',
                docker: 'Docker — Used for containerized deployment in THOZHIRPORUL and Dual-Layer AI Firewall.',
                xgboost: 'XGBoost — Used for prompt-injection ML classification in Dual-Layer AI Firewall.',
                opencv: 'OpenCV & MediaPipe — Used for real-time hand-gesture cursor control (ALPHA-01).',
                wordpress: 'WordPress & Tutor LMS — Used for e-learning delivery and performance optimization at Sasha Infinity.',
                figma: 'Figma — Used for UI/UX design on AISCCT Conference, SAST Organization, and Nexora.',
                java: 'Java — Certified via NPTEL Java (Elite + Gold).',
                c: 'C Programming — Listed under core technical languages on his resume.',
                'power bi': 'Power BI — Certified via Power BI Workshop for data visualization and analytics.',
                uipath: 'UiPath RPA — Certified via UiPath RPA Citizen Developer Foundation.'
            },
            languages: [
                'Urdu (Native)',
                'English (Professional Working Proficiency)',
                'Tamil (Fluent)',
                'Hindi (Conversational)'
            ]
        };

        function scrollToSection(selector) {
            const target = document.querySelector(selector);
            if (!target) return;
            if (window.lenis) {
                window.lenis.scrollTo(target);
            } else {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        function focusProjectInCarousel(projectId) {
            const allBtn = document.querySelector('.freq-btn');
            if (currentFilter !== 'all' && allBtn) {
                window.filterProjects('all', allBtn);
            }
            const list = getFiltered('all');
            const idx = list.findIndex(item => item.id === projectId);
            if (idx !== -1) {
                activeStackIndex = idx;
                updateCarouselPositions();
            }
            scrollToSection('#projects');
        }

        function appendMessage(sender, payload) {
            const wrapper = document.createElement('div');
            wrapper.className = `ai-msg ${sender}`;

            const bubble = document.createElement('div');
            bubble.className = 'ai-msg-bubble';

            if (typeof payload === 'string') {
                bubble.textContent = payload;
            } else {
                if (payload.text) {
                    const p = document.createElement('p');
                    p.style.margin = '0';
                    p.textContent = payload.text;
                    bubble.appendChild(p);
                }

                if (Array.isArray(payload.bullets) && payload.bullets.length) {
                    const ul = document.createElement('ul');
                    ul.className = 'ai-msg-list';
                    payload.bullets.forEach(item => {
                        const li = document.createElement('li');
                        if (typeof item === 'object' && item.label) {
                            const strong = document.createElement('strong');
                            strong.textContent = `${item.label}: `;
                            li.appendChild(strong);
                            li.appendChild(document.createTextNode(item.value || ''));
                        } else {
                            li.textContent = String(item);
                        }
                        ul.appendChild(li);
                    });
                    bubble.appendChild(ul);
                }

                if (Array.isArray(payload.actions) && payload.actions.length) {
                    const actionsRow = document.createElement('div');
                    actionsRow.className = 'ai-msg-actions';
                    payload.actions.forEach(act => {
                        if (act.href) {
                            const a = document.createElement('a');
                            a.className = 'ai-action-chip';
                            a.href = act.href;
                            if (act.download) {
                                a.setAttribute('download', act.download);
                            } else if (act.href.startsWith('http')) {
                                a.target = '_blank';
                                a.rel = 'noopener noreferrer';
                            }
                            a.textContent = act.label;
                            actionsRow.appendChild(a);
                        } else {
                            const btn = document.createElement('button');
                            btn.type = 'button';
                            btn.className = 'ai-action-chip';
                            btn.textContent = act.label;
                            btn.addEventListener('click', () => {
                                if (act.projectId) {
                                    setChatOpen(false);
                                    focusProjectInCarousel(act.projectId);
                                } else if (act.section) {
                                    setChatOpen(false);
                                    scrollToSection(act.section);
                                } else if (act.prompt) {
                                    handleUserQuery(act.prompt);
                                }
                            });
                            actionsRow.appendChild(btn);
                        }
                    });
                    bubble.appendChild(actionsRow);
                }
            }

            wrapper.appendChild(bubble);
            messagesEl.appendChild(wrapper);
            messagesEl.scrollTop = messagesEl.scrollHeight;
            return wrapper;
        }

        function showTypingIndicator() {
            const wrapper = document.createElement('div');
            wrapper.className = 'ai-msg bot';
            const bubble = document.createElement('div');
            bubble.className = 'ai-msg-bubble';
            bubble.innerHTML = '<div class="ai-typing-dots" aria-label="Thinking"><span></span><span></span><span></span></div>';
            wrapper.appendChild(bubble);
            messagesEl.appendChild(wrapper);
            messagesEl.scrollTop = messagesEl.scrollHeight;
            return wrapper;
        }

        function matchSpecificProject(q) {
            const aliases = [
                { id: 1, keys: ['hand gesture', 'gesture', 'mouse control', 'opencv', 'mediapipe', 'alpha-01'] },
                { id: 2, keys: ['fraud', 'credit card', 'beta-02'] },
                { id: 3, keys: ['sashainfinity', 'tutor lms', 'gamma-03', 'wordpress'] },
                { id: 4, keys: ['aiscct', 'conference', 'delta-04'] },
                { id: 5, keys: ['sast', 'echo-05'] },
                { id: 6, keys: ['nexora', 'niral', 'foxtrot-06'] },
                { id: 7, keys: ['thozhirporul', 'industrial', 'gis', 'golf-07'] },
                { id: 8, keys: ['firewall', 'llm', 'prompt injection', 'prompt-injection', 'xgboost', 'hotel-08'] },
                { id: 9, keys: ['sileos', 'knowledge architecture', 'india-09'] },
                { id: 10, keys: ['learn with sasha', 'learnwithsasha', 'math tutor', 'juliet-10'] }
            ];

            for (const entry of aliases) {
                if (entry.keys.some(k => q.includes(k))) {
                    const p = projects.find(proj => proj.id === entry.id);
                    if (p) return p;
                }
            }
            return null;
        }

        function answerPortfolioQuestion(rawQuery) {
            const q = rawQuery.toLowerCase().trim();

            // 1. Greetings & Help
            if (/^(hi|hello|hey|yo|hola|namaste|salam|good\s+(morning|afternoon|evening))\b/.test(q) && q.length < 30) {
                return {
                    text: `Hello! I'm ASTRA, ${BILAL_DATA.name}'s portfolio assistant. Ask me anything about his internship, 10 projects, tech stack, education, hackathons, certifications, or contact info.`,
                    actions: [
                        { label: 'Internship & Projects', prompt: 'Tell me about his internship at Sasha Infinity' },
                        { label: 'Top Skills', prompt: 'What are his skills?' }
                    ]
                };
            }

            if (/^(\?|help|commands|menu|what can you (do|ask)|topics)\b/.test(q)) {
                return {
                    text: `Available telemetry topics for ${BILAL_DATA.name}:`,
                    bullets: [
                        { label: 'Profile', value: 'Bio, location, languages, and hiring availability' },
                        { label: 'Internship', value: 'Web Developer Intern at Sasha Infinity (Sasha Infinity, Sileos, Learn With Sasha)' },
                        { label: 'Projects', value: 'All 10 missions (filter by AI/ML, React, Python, Web, or any tech like Docker/FastAPI)' },
                        { label: 'Skills & Certs', value: 'Tech stack proficiencies, NPTEL Java, UiPath RPA, Power BI, Cloud' },
                        { label: 'Education & Awards', value: 'MCA/BCA CGPA, SIF Pitch Fest Winner, Zen Code 26 Runner-up, SDG & SIH' }
                    ]
                };
            }

            // 2. Specific Project Match (only if not asking broadly about internship or all projects)
            const matchedProject = matchSpecificProject(q);
            if (matchedProject && !q.includes('internship') && !q.includes('all project')) {
                const actions = [{ label: `View ${matchedProject.codename} in Carousel`, projectId: matchedProject.id }];
                if (matchedProject.preview_url) {
                    actions.push({ label: 'Open Live Site', href: matchedProject.preview_url });
                }
                return {
                    text: `${matchedProject.name} (${matchedProject.codename} · ${matchedProject.missionClass})`,
                    bullets: [
                        { label: 'Summary', value: matchedProject.brief },
                        { label: 'Tech Stack', value: matchedProject.tools },
                        { label: 'Categories', value: matchedProject.category.join(', ').toUpperCase() }
                    ],
                    actions
                };
            }

            // 3. Internship & Experience
            if (/\b(intern|internship|experience|work\s+history|company|sasha\s*infinity|job)\b/.test(q)) {
                return {
                    text: `Bilal works as a ${BILAL_DATA.internship.role} at ${BILAL_DATA.internship.company} (${BILAL_DATA.internship.period}):`,
                    bullets: [
                        ...BILAL_DATA.internship.responsibilities.map((r, i) => ({ label: `Role ${i + 1}`, value: r })),
                        ...BILAL_DATA.internship.highlights.map(h => ({ label: 'Platform', value: h }))
                    ],
                    actions: [
                        { label: 'About Section', section: '#about' },
                        { label: 'Sashainfinity', projectId: 3 },
                        { label: 'Sileos', projectId: 9 },
                        { label: 'Learn With Sasha', projectId: 10 }
                    ]
                };
            }

            // 4. Live / Deployed Projects
            if (/\b(live|demo|deployed|links|urls|websites)\b/.test(q) && /\b(project|projects|site|sites|link|links|demo)\b/.test(q)) {
                const liveList = projects.filter(p => Boolean(p.preview_url));
                return {
                    text: `${liveList.length} of Bilal's missions have live deployed previews:`,
                    bullets: liveList.map(p => ({ label: p.name, value: p.preview_url })),
                    actions: [{ label: 'Explore Missions Log', section: '#projects' }]
                };
            }

            // 5. Category or Tech-Filtered Projects
            if (/\b(project|projects|mission|missions|built|build|portfolio|app|apps)\b/.test(q)) {
                let list = projects;
                let heading = `Bilal has ${projects.length} featured missions across AI/ML, Full-Stack React, Python, and Web development:`;

                const techTerms = ['react', 'python', 'typescript', 'tailwind', 'vite', 'node', 'express', 'fastapi', 'docker', 'postgres', 'postgresql', 'xgboost', 'scikit', 'opencv', 'mediapipe', 'wordpress', 'figma'];
                const matchedTech = techTerms.find(t => new RegExp(`\\b${t}\\b`, 'i').test(q));

                if (/\b(ai|ml|machine learning|llm|computer vision)\b/.test(q)) {
                    list = projects.filter(p => p.category.includes('ai'));
                    heading = `Here are Bilal's ${list.length} AI & Machine Learning missions:`;
                } else if (matchedTech) {
                    list = projects.filter(p =>
                        p.tools.toLowerCase().includes(matchedTech) ||
                        p.category.includes(matchedTech)
                    );
                    heading = `Missions using ${matchedTech.toUpperCase()} (${list.length}):`;
                } else if (/\bweb\b/.test(q)) {
                    list = projects.filter(p => p.category.includes('web'));
                    heading = `Here are Bilal's ${list.length} Web platform projects:`;
                }

                return {
                    text: heading,
                    bullets: list.map(p => ({ label: p.codename, value: `${p.name} (${p.tools})` })),
                    actions: [{ label: 'Explore Missions Log', section: '#projects' }]
                };
            }

            // 6. Specific Extra Skill (TypeScript, Tailwind, Docker, XGBoost, Java, C, Power BI, UiPath, etc.)
            const extraKey = Object.keys(BILAL_DATA.extraSkills).find(k => new RegExp(`\\b${k}\\b`, 'i').test(q));
            if (extraKey && !/\b(all|skills|tech stack)\b/.test(q)) {
                return {
                    text: BILAL_DATA.extraSkills[extraKey],
                    actions: [
                        { label: 'Inspect Skills System', section: '#skills' },
                        { label: 'Explore Missions', section: '#projects' }
                    ]
                };
            }

            // 7. Specific Core Planetary Skill Check
            const skillKeyMap = {
                react: 'react',
                next: 'react',
                redux: 'react',
                html: 'html',
                css: 'css',
                javascript: 'js',
                node: 'node',
                express: 'node',
                fastapi: 'node',
                graphql: 'node',
                python: 'python',
                pandas: 'python',
                numpy: 'python',
                sql: 'sql',
                postgres: 'sql',
                postgresql: 'sql',
                mysql: 'sql',
                mongodb: 'sql',
                supabase: 'sql',
                database: 'sql',
                git: 'git',
                github: 'git',
                devops: 'git'
            };

            const matchedSkillKey = Object.keys(skillKeyMap).find(k => new RegExp(`\\b${k}\\b`, 'i').test(q));
            if (matchedSkillKey && !/\b(all|skills|tech stack)\b/.test(q)) {
                const s = skillsData[skillKeyMap[matchedSkillKey]];
                if (s) {
                    const related = projects.filter(p =>
                        p.tools.toLowerCase().includes(matchedSkillKey) ||
                        p.category.includes(skillKeyMap[matchedSkillKey])
                    );
                    return {
                        text: `${s.title} (${s.level} · ${s.percent}) — ${s.desc}`,
                        bullets: [
                            { label: 'Tools & Frameworks', value: s.tools },
                            related.length ? { label: 'Used In', value: related.map(r => r.name).join(', ') } : null
                        ].filter(Boolean),
                        actions: [{ label: 'Open Skills System', section: '#skills' }]
                    };
                }
            }

            // 8. General Skills & Tech Stack
            if (/\b(skill|skills|tech|stack|technologies|tools|framework|programming|coding)\b/.test(q)) {
                return {
                    text: 'Bilal specializes in full-stack web engineering, APIs, databases, and AI/ML integrations:',
                    bullets: [
                        { label: 'Languages', value: 'Python, C, JavaScript, TypeScript, SQL, Java (NPTEL Elite + Gold)' },
                        { label: 'Frontend', value: 'React.js, Next.js, Tailwind CSS, Vite, HTML5, CSS3' },
                        { label: 'Backend & APIs', value: 'Node.js, Express.js, FastAPI, REST APIs, GraphQL' },
                        { label: 'Databases', value: 'PostgreSQL, MySQL, MongoDB, Supabase' },
                        { label: 'AI / ML', value: 'Scikit-learn, XGBoost, Pandas, NumPy, OpenCV, MediaPipe' },
                        { label: 'DevOps & Platforms', value: 'Git, GitHub, Docker, CI/CD, WordPress, Tutor LMS, Figma, Power BI' }
                    ],
                    actions: [{ label: 'Inspect Planetary Skills', section: '#skills' }]
                };
            }

            // 9. Education & Academic Trajectory
            if (/\b(educat|degree|college|university|mca|bca|hsc|sslc|cgpa|gpa|grade|school|sona|study|graduat)\b/.test(q)) {
                return {
                    text: "Here is Mohammed Bilal's academic trajectory:",
                    bullets: BILAL_DATA.education,
                    actions: [{ label: 'View Stellar Trajectory', section: '#journey' }]
                };
            }

            // 10. Hackathons & Achievements
            if (/\b(hackathon|award|achiev|win|winner|prize|sih|pitch|zen code|sdg|niral|competition)\b/.test(q)) {
                return {
                    text: "Mohammed Bilal's hackathon expeditions and competition highlights:",
                    bullets: BILAL_DATA.hackathons,
                    actions: [{ label: 'View About Dossier', section: '#about' }]
                };
            }

            // 11. Certifications
            if (/\b(certif|certificate|nptel|rpa|bootcamp|course)\b/.test(q)) {
                return {
                    text: 'Verified certifications listed on his resume:',
                    bullets: BILAL_DATA.certifications,
                    actions: [{ label: 'Download Resume PDF', href: BILAL_DATA.resumeUrl, download: 'Mohammed_Bilal_A_Resume.pdf' }]
                };
            }

            // 12. Spoken Languages
            if (/\b(language|languages|speak|fluent|urdu|tamil|hindi|english)\b/.test(q)) {
                return {
                    text: 'Languages Mohammed Bilal speaks:',
                    bullets: BILAL_DATA.languages
                };
            }

            // 13. Location
            if (/\b(where|location|city|place|based|from|salem|tamil nadu|india)\b/.test(q)) {
                return {
                    text: `Mohammed Bilal is based in ${BILAL_DATA.location}.`,
                    actions: [{ label: 'Mission Control Contact', section: '#contact' }]
                };
            }

            // 14. Resume / CV
            if (/\b(resume|cv|pdf|download)\b/.test(q)) {
                return {
                    text: "You can download Mohammed Bilal's latest resume PDF directly below.",
                    actions: [
                        { label: 'Download Resume PDF', href: BILAL_DATA.resumeUrl, download: 'Mohammed_Bilal_A_Resume.pdf' },
                        { label: 'About Section', section: '#about' }
                    ]
                };
            }

            // 15. Contact / Hire / Availability
            if (/\b(contact|email|mail|phone|call|number|hire|available|availability|role|opportunity|reach|linkedin|instagram|social)\b/.test(q)) {
                return {
                    text: 'Mohammed Bilal is open to software engineering, full-stack, and AI/ML opportunities. Reach him via:',
                    bullets: [
                        { label: 'Email', value: BILAL_DATA.email },
                        { label: 'Phone', value: BILAL_DATA.phone },
                        { label: 'Location', value: BILAL_DATA.location }
                    ],
                    actions: [
                        { label: 'Email Bilal', href: `mailto:${BILAL_DATA.email}` },
                        { label: 'LinkedIn', href: BILAL_DATA.linkedin },
                        { label: 'GitHub', href: BILAL_DATA.github },
                        { label: 'Go to Mission Control', section: '#contact' }
                    ]
                };
            }

            // 16. Who is Bilal / About / Profile
            if (/\b(who|about|bilal|mohammed|intro|summary|profile|tell me|yourself|him)\b/.test(q)) {
                return {
                    text: `${BILAL_DATA.name} is a ${BILAL_DATA.role} based in ${BILAL_DATA.location}. ${BILAL_DATA.summary}`,
                    bullets: [
                        { label: 'Current Role', value: `${BILAL_DATA.internship.role} at ${BILAL_DATA.internship.company} (${BILAL_DATA.internship.period})` },
                        { label: 'Education', value: 'Pursuing MCA at Sona College of Technology (CGPA: 8.3/10)' },
                        { label: 'Highlights', value: 'SIF Pitch Fest 2026 Winner · Zen Code 26 Runner-up · SDG Hackathon 2026 Finalist' }
                    ],
                    actions: [
                        { label: 'About Dossier', section: '#about' },
                        { label: 'Download Resume', href: BILAL_DATA.resumeUrl, download: 'Mohammed_Bilal_A_Resume.pdf' }
                    ]
                };
            }

            // 17. Grounded Fallback (No hallucination)
            return {
                text: `I only answer questions grounded in ${BILAL_DATA.name}'s portfolio and resume. Try asking about his internship at Sasha Infinity, any of his 10 projects, tech stack, education, hackathons, certifications, or contact details!`,
                actions: [
                    { label: 'List All Projects', prompt: 'Show all projects' },
                    { label: 'Tech Stack', prompt: 'What are his skills?' },
                    { label: 'Contact Info', prompt: 'How can I contact Bilal?' }
                ]
            };
        }

        async function getAiReply(query) {
            if (AI_ENDPOINT) {
                try {
                    const parsedEndpoint = new URL(AI_ENDPOINT, window.location.origin);
                    if (parsedEndpoint.protocol === 'https:') {
                        const res = await fetch(parsedEndpoint.href, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ question: query, profile: BILAL_DATA, projects })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            if (data && typeof data.reply === 'string') return { text: data.reply };
                        }
                    }
                } catch (_) {
                    // Fall back smoothly to local grounded engine
                }
            }
            return answerPortfolioQuestion(query);
        }

        let isReplying = false;
        function handleUserQuery(rawText) {
            const query = rawText.trim();
            if (!query || isReplying) return;

            appendMessage('user', query);
            input.value = '';
            isReplying = true;

            const typingNode = showTypingIndicator();
            const delay = REDUCE_MOTION ? 60 : 320;

            setTimeout(async () => {
                const reply = await getAiReply(query);
                typingNode.remove();
                appendMessage('bot', reply);
                isReplying = false;
            }, delay);
        }

        function seedWelcomeMessage() {
            messagesEl.innerHTML = '';
            if (quickPromptsEl) quickPromptsEl.classList.remove('is-hidden');
            appendMessage('bot', {
                text: `Welcome aboard! I'm ASTRA, the AI assistant for ${BILAL_DATA.name}'s portfolio. Ask me about his experience, projects, tech stack, education, or how to get in touch.`,
                actions: [
                    { label: 'View Missions Log', section: '#projects' },
                    { label: 'Download Resume', href: BILAL_DATA.resumeUrl, download: 'Mohammed_Bilal_A_Resume.pdf' }
                ]
            });
        }

        function setChatOpen(open) {
            panel.classList.toggle('active', open);
            if (backdrop) backdrop.classList.toggle('active', open);
            launcher.classList.toggle('open', open);
            launcher.setAttribute('aria-expanded', String(open));
            panel.setAttribute('aria-hidden', String(!open));
            if (backdrop) backdrop.setAttribute('aria-hidden', String(!open));
            if (open) {
                setTimeout(() => input.focus({ preventScroll: true }), 100);
            }
        }

        launcher.addEventListener('click', () => {
            setChatOpen(!panel.classList.contains('active'));
        });

        if (backdrop) {
            backdrop.addEventListener('click', () => setChatOpen(false));
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => setChatOpen(false));
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => seedWelcomeMessage());
        }

        if (quickPromptsEl) {
            quickPromptsEl.querySelectorAll('.ai-prompt-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const q = chip.getAttribute('data-prompt') || chip.textContent;
                    handleUserQuery(q);
                });
            });
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleUserQuery(input.value);
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setChatOpen(!panel.classList.contains('active'));
            } else if (e.key === 'Escape' && panel.classList.contains('active')) {
                setChatOpen(false);
            }
        });

        seedWelcomeMessage();
    })();

});

// --- 8. AUDIO: Space Ambience (Quiet Deep Space) ---
// Initialize strictly on first valid user activation gesture
const enableAudio = () => {
    if (window.hasSpaceAudioStarted) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    let ctx;
    try {
        ctx = new AudioContext();
    } catch (e) {
        return;
    }

    window.hasSpaceAudioStarted = true;
    document.body.removeEventListener('click', enableAudio);
    document.body.removeEventListener('touchstart', enableAudio);
    document.body.removeEventListener('keydown', enableAudio);

    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => { });
    }

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

// Listen for valid user activation gestures (excluding 'scroll', which browsers reject for AudioContext autoplay)
document.body.addEventListener('click', enableAudio, { once: true });
document.body.addEventListener('touchstart', enableAudio, { once: true, passive: true });
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = document.getElementById('warpTrailCanvas');
    if (!canvas) return;

    const section = document.getElementById('journey');
    if (!section) return;

    const ctx = canvas.getContext('2d');
    const celestialNodes = Array.from(section.querySelectorAll('.celestial-body'));
    let particles = [];
    let cachedPositions = [];
    let animationId = null;
    let isVisible = false;

    // Cache center positions of each celestial body on resize/intersection to avoid 60fps layout thrashing
    function updateNodePositions() {
        const sectionRect = section.getBoundingClientRect();
        cachedPositions = celestialNodes.map(node => {
            const rect = node.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2 - sectionRect.left,
                y: rect.top + rect.height / 2 - sectionRect.top
            };
        });
    }

    function resizeCanvas() {
        const newW = section.offsetWidth;
        const newH = section.offsetHeight;
        if (Math.abs(canvas.width - newW) > 2 || Math.abs(canvas.height - newH) > 2) {
            canvas.width = newW;
            canvas.height = newH;
        }
        updateNodePositions();
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

    function updateAndDraw() {
        if (!isVisible) {
            animationId = null;
            return;
        }

        if (canvas.width !== section.offsetWidth || canvas.height !== section.offsetHeight) {
            resizeCanvas();
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const positions = cachedPositions;

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

    // Visibility check using IntersectionObserver: start/stop RAF only when #journey is visible
    const visObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
            if (isVisible) {
                resizeCanvas();
                if (!animationId) {
                    animationId = requestAnimationFrame(updateAndDraw);
                }
            } else if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        });
    }, { threshold: 0.1 });
    visObserver.observe(section);

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
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
        if (!telemetryEl) return;
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
        if (percentEl) {
            percentEl.textContent = displayVal.toString().padStart(2, '0') + '%';
        }
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

    // Verified baseline snapshot of @Bilalyzr's active contribution dates for instant / offline rendering
    const FALLBACK_ACTIVE_MAP = {
        '2025-12-08': [5, 4],
        '2026-01-17': [1, 1],
        '2026-02-13': [2, 1], '2026-02-20': [4, 2], '2026-02-28': [3, 1],
        '2026-03-01': [2, 1], '2026-03-02': [1, 1], '2026-03-04': [1, 1], '2026-03-05': [2, 1], '2026-03-10': [4, 2],
        '2026-04-05': [1, 1], '2026-04-14': [9, 3], '2026-04-19': [2, 1], '2026-04-25': [3, 1],
        '2026-05-03': [2, 1], '2026-05-06': [1, 1], '2026-05-07': [7, 2], '2026-05-08': [1, 1], '2026-05-09': [1, 1], '2026-05-10': [1, 1],
        '2026-05-19': [19, 4], '2026-05-20': [4, 2], '2026-05-24': [1, 1], '2026-05-25': [7, 2], '2026-05-26': [2, 1],
        '2026-06-11': [2, 1], '2026-06-13': [2, 1], '2026-06-14': [2, 1], '2026-06-20': [3, 1], '2026-06-21': [3, 1],
        '2026-06-24': [3, 1], '2026-06-26': [1, 1], '2026-06-27': [1, 1], '2026-06-29': [2, 1],
        '2026-07-04': [1, 1], '2026-07-05': [4, 2], '2026-07-11': [1, 1], '2026-07-13': [1, 1], '2026-07-15': [3, 1],
        '2026-07-16': [2, 1], '2026-07-17': [4, 2], '2026-07-20': [1, 1], '2026-07-21': [5, 2],
        '2026-07-23': [1, 1], '2026-07-24': [1, 1], '2026-07-25': [3, 1],
        '2026-08-03': [6, 2], '2026-08-04': [1, 1], '2026-08-05': [7, 2], '2026-08-06': [1, 1],
        '2026-08-07': [1, 1], '2026-08-12': [2, 1], '2026-08-13': [1, 1], '2026-08-14': [10, 3],
        '2026-08-15': [3, 1], '2026-08-20': [6, 2], '2026-08-21': [9, 3], '2026-08-22': [2, 1],
        '2026-08-25': [19, 4], '2026-08-31': [4, 2],
        '2026-09-01': [4, 2], '2026-09-03': [2, 1], '2026-09-04': [1, 1], '2026-09-05': [9, 3],
        '2026-09-06': [16, 4], '2026-09-08': [8, 3], '2026-09-09': [1, 1], '2026-09-10': [12, 4],
        '2026-09-12': [11, 4], '2026-09-13': [1, 1], '2026-09-14': [2, 1], '2026-09-16': [2, 1], '2026-09-17': [1, 1],
        '2026-09-21': [3, 1], '2026-09-22': [19, 4], '2026-09-23': [4, 2], '2026-09-24': [2, 1],
        '2026-09-25': [9, 3], '2026-09-26': [5, 2], '2026-09-27': [3, 1], '2026-09-28': [3, 1],
        '2026-09-29': [4, 2], '2026-09-30': [2, 1],
        '2026-10-03': [26, 4], '2026-10-05': [5, 2], '2026-10-06': [13, 4], '2026-10-07': [3, 1],
        '2026-10-08': [1, 1], '2026-10-09': [3, 1], '2026-10-10': [6, 2], '2026-10-11': [14, 4],
        '2026-10-13': [1, 1], '2026-10-14': [2, 1], '2026-10-16': [6, 2], '2026-10-17': [9, 3],
        '2026-10-18': [3, 1]
    };

    function countToLevel(count) {
        if (!count || count <= 0) return 0;
        if (count <= 3) return 1;
        if (count <= 7) return 2;
        if (count <= 13) return 3;
        return 4;
    }

    // Build a dynamic rolling 52-week window ending today (aligned to Sunday start for accurate Mon/Wed/Fri rows)
    function buildRollingWindow(dayMap) {
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const startUTC = new Date(todayUTC);
        startUTC.setUTCDate(startUTC.getUTCDate() - 364);
        // Align start date back to Sunday (0) so grid-auto-flow: column maps Row 0=Sun, Row 1=Mon, Row 3=Wed, Row 5=Fri
        startUTC.setUTCDate(startUTC.getUTCDate() - startUTC.getUTCDay());

        const list = [];
        for (let d = new Date(startUTC); d <= todayUTC; d.setUTCDate(d.getUTCDate() + 1)) {
            const iso = d.toISOString().slice(0, 10);
            const entry = dayMap[iso];
            const count = entry ? entry.count : 0;
            const level = entry && typeof entry.level === 'number' ? entry.level : countToLevel(count);
            list.push({ date: iso, count, level });
        }
        return list;
    }

    function buildFallbackContributions() {
        const map = {};
        Object.keys(FALLBACK_ACTIVE_MAP).forEach(date => {
            const [count, level] = FALLBACK_ACTIVE_MAP[date];
            map[date] = { count, level };
        });
        return buildRollingWindow(map);
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

        let computedSum = 0;
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
            computedSum += day.count;
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
            const lvl = Math.min(4, Math.max(0, day.level || countToLevel(day.count)));
            cell.className = `gh-cell lvl-${lvl}`;
            cell.dataset.date = day.date;
            cell.dataset.count = day.count;

            const showCellInfo = () => {
                const readableDate = formatReadoutDate(day.date);
                const safeCount = Number(day.count) || 0;
                if (readoutEl) {
                    const label = safeCount === 0
                        ? `0 CONTRIBUTIONS ON ${readableDate.toUpperCase()}`
                        : `${safeCount} CONTRIBUTION${safeCount > 1 ? 'S' : ''} ON ${readableDate.toUpperCase()}`;
                    readoutEl.textContent = '';
                    const pulseSpan = document.createElement('span');
                    pulseSpan.className = 'readout-pulse';
                    const textSpan = document.createElement('span');
                    textSpan.className = 'readout-text';
                    textSpan.style.color = safeCount > 0 ? 'var(--gh-accent)' : 'rgba(240,246,252,0.75)';
                    textSpan.textContent = label;
                    readoutEl.appendChild(pulseSpan);
                    readoutEl.appendChild(textSpan);
                }

                if (floatingTooltip) {
                    const hudRect = ghHud.getBoundingClientRect();
                    const cellRect = cell.getBoundingClientRect();
                    const leftPx = cellRect.left - hudRect.left + (cellRect.width / 2);
                    const topPx = cellRect.top - hudRect.top;

                    const clampedLeft = Math.max(90, Math.min(hudRect.width - 90, leftPx));
                    floatingTooltip.style.left = `${clampedLeft}px`;
                    floatingTooltip.style.top = `${topPx}px`;
                    floatingTooltip.textContent = '';
                    if (safeCount === 0) {
                        floatingTooltip.textContent = `No contributions on ${readableDate}`;
                    } else {
                        const strongEl = document.createElement('strong');
                        strongEl.textContent = `${safeCount} contribution${safeCount > 1 ? 's' : ''}`;
                        floatingTooltip.appendChild(strongEl);
                        floatingTooltip.appendChild(document.createTextNode(` on ${readableDate}`));
                    }
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

        const finalTotal = typeof totalOverride === 'number'
            ? Math.max(totalOverride, computedSum)
            : computedSum;

        if (totalEl) totalEl.textContent = finalTotal.toLocaleString();
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

    // 1. Render immediately with verified baseline snapshot so there is zero blank state
    renderContributions(buildFallbackContributions());

    // 2. Fetch live GitHub telemetry automatically (merges multi-year calendar API + real-time GitHub commit/event streams)
    let isFetchingLive = false;
    let lastFetchTime = 0;

    async function fetchLiveGitHubTelemetry(forceRefresh = false) {
        const nowMs = Date.now();
        if (isFetchingLive) return;
        if (!forceRefresh && lastFetchTime > 0 && (nowMs - lastFetchTime) < 45000) return;
        isFetchingLive = true;

        try {
            // Seed dayMap with verified baseline so offline/partial responses never lose known history
            const dayMap = {};
            Object.keys(FALLBACK_ACTIVE_MAP).forEach(date => {
                const [count, level] = FALLBACK_ACTIVE_MAP[date];
                dayMap[date] = { count, level };
            });

            // Cutoff date for recent real-time commit search (last 14 days)
            const recentDateObj = new Date(nowMs - 14 * 86400000);
            const recentSinceIso = recentDateObj.toISOString().slice(0, 10);

            const [allContribRes, lastContribRes, userRes, commitsRes, eventsRes] = await Promise.allSettled([
                fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=all`, { cache: 'no-store' }),
                fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`, { cache: 'no-store' }),
                fetch(`https://api.github.com/users/${GITHUB_USER}`, { cache: 'no-store' }),
                fetch(`https://api.github.com/search/commits?q=author:${GITHUB_USER}+committer-date:>=${recentSinceIso}&per_page=100&sort=committer-date&order=desc`, {
                    cache: 'no-store',
                    headers: { 'Accept': 'application/vnd.github.cloak-preview+json' }
                }),
                fetch(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100`, { cache: 'no-store' })
            ]);

            const mergeCalendarList = (list) => {
                if (!Array.isArray(list)) return;
                list.forEach(item => {
                    if (!item || !item.date) return;
                    const c = Number(item.count) || 0;
                    const l = typeof item.level === 'number' ? item.level : countToLevel(c);
                    const prev = dayMap[item.date];
                    if (!prev || c >= prev.count) {
                        dayMap[item.date] = { count: c, level: l || countToLevel(c) };
                    }
                });
            };

            if (lastContribRes.status === 'fulfilled' && lastContribRes.value.ok) {
                const data = await lastContribRes.value.json();
                if (data && Array.isArray(data.contributions)) {
                    mergeCalendarList(data.contributions);
                }
            }

            if (allContribRes.status === 'fulfilled' && allContribRes.value.ok) {
                const data = await allContribRes.value.json();
                if (data && Array.isArray(data.contributions)) {
                    mergeCalendarList(data.contributions);
                }
            }

            // Overlay real-time commits from GitHub Search API (bypasses any proxy CDN cache delay for today's pushes)
            const realtimeDayCounts = {};
            if (commitsRes.status === 'fulfilled' && commitsRes.value.ok) {
                const commitsData = await commitsRes.value.json();
                if (commitsData && Array.isArray(commitsData.items)) {
                    commitsData.items.forEach(item => {
                        const rawDate = item?.commit?.committer?.date || item?.commit?.author?.date;
                        if (rawDate) {
                            const isoDay = new Date(rawDate).toISOString().slice(0, 10);
                            realtimeDayCounts[isoDay] = (realtimeDayCounts[isoDay] || 0) + 1;
                        }
                    });
                }
            }

            // Also count real-time public events (PRs, issues, repo creations, pushes) per day
            const eventDayCounts = {};
            if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
                const eventsData = await eventsRes.value.json();
                if (Array.isArray(eventsData)) {
                    eventsData.forEach(ev => {
                        if (!ev || !ev.created_at) return;
                        if (['PushEvent', 'CreateEvent', 'PullRequestEvent', 'IssuesEvent'].includes(ev.type)) {
                            const isoDay = new Date(ev.created_at).toISOString().slice(0, 10);
                            const weight = ev.type === 'PushEvent'
                                ? Math.max(1, Number(ev.payload?.distinct_size) || Number(ev.payload?.size) || 1)
                                : 1;
                            eventDayCounts[isoDay] = (eventDayCounts[isoDay] || 0) + weight;
                        }
                    });
                }
            }

            Object.keys({ ...realtimeDayCounts, ...eventDayCounts }).forEach(isoDay => {
                const liveCount = Math.max(realtimeDayCounts[isoDay] || 0, eventDayCounts[isoDay] || 0);
                const existing = dayMap[isoDay]?.count || 0;
                if (liveCount > existing) {
                    dayMap[isoDay] = {
                        count: liveCount,
                        level: countToLevel(liveCount)
                    };
                }
            });

            const rollingList = buildRollingWindow(dayMap);
            renderContributions(rollingList);

            if (userRes.status === 'fulfilled' && userRes.value.ok) {
                const userData = await userRes.value.json();
                if (userData) {
                    if (typeof userData.public_repos === 'number' && reposEl) {
                        reposEl.textContent = userData.public_repos;
                    }
                    const avatarImg = document.getElementById('ghAvatar');
                    if (typeof userData.avatar_url === 'string' && avatarImg) {
                        try {
                            const parsedUrl = new URL(userData.avatar_url);
                            if (parsedUrl.protocol === 'https:' && (parsedUrl.hostname === 'avatars.githubusercontent.com' || parsedUrl.hostname.endsWith('.githubusercontent.com'))) {
                                avatarImg.src = parsedUrl.href;
                            }
                        } catch (_) {
                            // Ignore malformed avatar URL
                        }
                    }
                }
            }

            lastFetchTime = Date.now();
        } catch (err) {
            // Baseline snapshot is already rendered
        } finally {
            isFetchingLive = false;
        }
    }

    // Automatically fetch live GitHub telemetry on page load and refresh every 2 minutes
    fetchLiveGitHubTelemetry(true);
    setInterval(() => fetchLiveGitHubTelemetry(true), 120000);

    // --- Hover & Touch / Click State Machine ---
    let isPinned = false;
    let hoverTimer = null;

    function openHud(pin = false) {
        clearTimeout(hoverTimer);
        if (pin) isPinned = true;
        ghHud.classList.add('active');
        ghCard.classList.add('hud-open');
        ghCard.setAttribute('aria-expanded', 'true');
        fetchLiveGitHubTelemetry(false);
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

// =========================================================================
// 9. ORBITAL SECURITY SHIELD (Zero-Lag Anti-Inspect, Anti-Copy & HUD Alert)
// =========================================================================
(function initOrbitalSecurityShield() {
    // 1. Prevent external sites from framing/cloning this portfolio inside an iframe
    try {
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }
    } catch (_) {
        // Cross-origin frame guard fallback
    }

    // 2. Console Copyright & Security Telemetry Notice
    try {
        console.log(
            '%c DVLPR // ORBITAL SECURITY ACTIVE ',
            'background:#050b16;color:#00ffff;font-family:monospace;font-size:14px;font-weight:bold;padding:6px 12px;border:1px solid #00d2ff;border-left:4px solid #00ffff;border-radius:4px;'
        );
        console.log(
            '%cOriginal architecture & design © Mohammed Bilal (https://github.com/Bilalyzr). Unauthorized replication or redistribution of this portfolio is prohibited.',
            'color:#b3c5ef;font-family:monospace;font-size:11px;'
        );
    } catch (_) { }

    let toastEl = null;
    let toastTimer = null;

    function showSecurityToast(reason) {
        if (!document.body) return;
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'orbital-security-toast';
            toastEl.setAttribute('role', 'status');
            toastEl.setAttribute('aria-live', 'polite');
            toastEl.innerHTML = `
                <div class="ost-icon"><i class="fas fa-shield-halved"></i></div>
                <div class="ost-body">
                    <span class="ost-title">ORBITAL SECURITY // SHIELD ACTIVE</span>
                    <span class="ost-msg"></span>
                </div>
            `;
            document.body.appendChild(toastEl);
        }

        const msgNode = toastEl.querySelector('.ost-msg');
        if (msgNode) {
            msgNode.textContent = reason || 'Source & assets protected · © Mohammed Bilal';
        }

        toastEl.classList.add('active');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            if (toastEl) toastEl.classList.remove('active');
        }, 2400);
    }

    // 3. Block Right-Click Context Menu (while keeping Contact links & AI Chat selectable for recruiters)
    document.addEventListener('contextmenu', (e) => {
        if (e.target && (e.target.closest('#contact .contact-card') || e.target.closest('#aiChatPanel'))) {
            return; // Allow recruiters to copy email, AI replies, or open links in new tab
        }
        e.preventDefault();
        showSecurityToast('Right-click disabled · © Mohammed Bilal');
    });

    // 4. Block Dragging of Images, Planets & 3D Assets
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });

    // 5. Block DevTools, View-Source & Save-Page Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        const key = (e.key || '').toUpperCase();
        const ctrlOrCmd = e.ctrlKey || e.metaKey;

        // F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            showSecurityToast('Inspection terminal locked · © Mohammed Bilal');
            return false;
        }

        // Ctrl/Cmd + Shift + I / J / C (DevTools Inspector / Console / Element Picker)
        if (ctrlOrCmd && e.shiftKey && (key === 'I' || key === 'J' || key === 'C')) {
            e.preventDefault();
            e.stopPropagation();
            showSecurityToast('Inspection terminal locked · © Mohammed Bilal');
            return false;
        }

        // Ctrl/Cmd + U (View Page Source) or Ctrl/Cmd + S (Save Webpage As)
        if (ctrlOrCmd && !e.shiftKey && (key === 'U' || key === 'S')) {
            e.preventDefault();
            e.stopPropagation();
            showSecurityToast('Source extraction blocked · © Mohammed Bilal');
            return false;
        }
    }, true);
})();
