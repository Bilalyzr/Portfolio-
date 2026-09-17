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
                if (mobileNav && mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
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


    // --- 2. GLOBAL CANVAS BACKGROUND — Static Starfield ---
    // Non-animated: a still field of stars drawn once (and on resize) for a
    // quiet space backdrop. No motion, no cursor effects, no requestAnimationFrame.
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

            const count = Math.min(220, Math.max(80, Math.round((W * H) / 9000)));
            for (let i = 0; i < count; i++) {
                const depth = Math.random();
                const size = 0.5 + depth * 1.4;
                const alpha = 0.25 + depth * 0.55;
                const x = Math.random() * W;
                const y = Math.random() * H;
                const tint = STAR_TINTS[(Math.random() * STAR_TINTS.length) | 0];

                ctx.fillStyle = tint + alpha + ')';
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();

                if (size > 1.4) {
                    ctx.fillStyle = tint + (alpha * 0.12) + ')';
                    ctx.beginPath();
                    ctx.arc(x, y, size * 2.6, 0, Math.PI * 2);
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
    const universeContainer = document.querySelector('#skills .universe-container');

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
        if (universeContainer) universeContainer.classList.add('paused-orbit');

        // Animate Progress Bar after card is visible
        setTimeout(() => {
            skillProgress.style.width = data.percent;
        }, 300);
    };

    window.closeSkillCard = function () {
        skillCard.classList.remove('open');
        if (universeContainer) universeContainer.classList.remove('paused-orbit');
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
            name: "AISCCT Conference website for my department",
            tools: "HTML, CSS, JavaScript, Figma",
            category: ["web"],
            missionClass: "CONSTRUCT",
            status: "complete",
            icon: ["fab fa-html5", "fab fa-css3-alt", "fab fa-figma"],
            brief: "Designed and developed a static web page for an international conference organized by the department.",
            img: "assets/images/conference_website.png",
            preview_url: "https://www.sonatech.ac.in/aiscct-26/"
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
            img: "assets/images/sast_website.png",
            preview_url: "https://sast.org.in/"
        },
        {
            id: 6,
            codename: "FOXTROT-06",
            name: "Nexora Startup Landing Page",
            tools: "HTML, CSS, JavaScript, Figma",
            category: ["web"],
            missionClass: "CONSTRUCT",
            status: "complete",
            icon: ["fab fa-html5", "fab fa-css3-alt", "fab fa-js", "fab fa-figma"],
            brief: "Designed and developed a premium landing page for my startup company to showcase the Niral Thiruvizha 3.0 project.",
            img: "assets/images/niral_landing.png",
            preview_url: "https://nexora-indusio.netlify.app/"
        },
        {
            id: 7,
            codename: "GOLF-07",
            name: "THOZHIRPORUL – Smart Industrial Monitoring System",
            tools: "React.js, Node.js, Express.js, PostgreSQL, JWT, AI Integration",
            category: ["web", "react", "ai"],
            missionClass: "COMMAND",
            status: "in progress",
            icon: ["fab fa-react", "fab fa-node-js", "fas fa-database", "fas fa-brain"],
            brief: "AI-powered industrial governance platform for SIPCOT featuring real-time monitoring, compliance tracking, and intelligent decision support.",
            img: "assets/images/thozhirporul.png"
        },
        {
            id: 8,
            codename: "HOTEL-08",
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

            // Enhanced 3D stacking
            if (window.innerWidth > 768) {
                // More dramatic spread for active card
                const spreadX = offset * 60;
                const spreadZ = -Math.abs(offset) * 120;
                const rotY = offset * -15;

                card.style.transform = `translateX(${spreadX}px) translateZ(${spreadZ}px) rotateY(${rotY}deg)`;
                card.style.opacity = Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.3;
                card.style.zIndex = 10 - Math.abs(offset);
            }

            card.innerHTML = `
                <div class="sc-img">
                    <div class="scanlines"></div>
                    <img src="${p.img}" alt="${p.name}">
                    <span class="sc-codename">${p.codename}</span>
                    <span class="sc-status ${p.status === 'in progress' ? 'in-progress' : 'complete'}"><span class="sc-status-dot"></span>${p.status.toUpperCase()}</span>
                </div>
                <div class="sc-body">
                    <div class="sc-class">${p.missionClass}</div>
                    <div class="sc-name">${p.name}</div>
                    <div class="sc-tools"><span>PAYLOAD:</span> ${p.tools}</div>
                    <div class="sc-brief" id="brief-${p.id}">${p.brief}</div>
                    <div class="sc-icons">${iconsHtml}</div>
                    ${p.preview_url ? `
                    <div class="sc-actions">
                        <a href="${p.preview_url}" target="_blank" class="sc-btn">
                            <i class="fas fa-external-link-alt"></i> MISSION PREVIEW
                        </a>
                    </div>` : ''}
                </div>
            `;

            // Terminal Typing Effect for active card
            if (i === activeStackIndex) {
                setTimeout(() => {
                    const briefEl = card.querySelector('.sc-brief');
                    if (briefEl) {
                        const text = p.brief;
                        briefEl.textContent = '';
                        let charIndex = 0;

                        // Cancel any previous typing on this element if it exists
                        if (briefEl.typingTimeout) clearTimeout(briefEl.typingTimeout);

                        function type() {
                            // Bug Fix: Check if element still exists in DOM to avoid wasted cycles
                            if (!document.contains(briefEl)) return;
                            
                            if (charIndex < text.length) {
                                briefEl.textContent += text.charAt(charIndex);
                                charIndex++;
                                briefEl.typingTimeout = setTimeout(type, 20);
                            }
                        }
                        type();
                    }
                }, 400);
            }

            card.addEventListener('click', () => {
                if (activeStackIndex !== i) {
                    activeStackIndex = i;
                    renderStack();
                }
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


