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


    // --- 2. HERO: Background Stars ---
    createStars('star-container-hero', 200);

    // --- GLOBAL PARALLAX BACKGROUND ---
    // Multi-layer star field
    createStars('p-layer-1', 200);
    createStars('p-layer-2', 300);
    createStars('p-layer-3', 150);

    // --- GLOBAL & SECTION PARALLAX ENGINE ---
    const parallaxLayers = document.querySelectorAll('.parallax-layer');
    const sectionBgs = document.querySelectorAll('.section-bg');

    function updateParallax() {
        const scrolled = window.pageYOffset;

        // 1. Global Star Layers (Background)
        parallaxLayers.forEach(layer => {
            const speed = parseFloat(layer.getAttribute('data-speed'));
            const yPos = -(scrolled * speed);
            layer.style.transform = `translateY(${yPos}px)`;
        });

        // 2. Section Backgrounds (Images)
        sectionBgs.forEach(bg => {
            const section = bg.closest('section');
            if (section) {
                const speed = 0.2; // Moderate parallax intensity
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;

                // Optimization: Only animate if relatively near viewport
                if (scrolled + window.innerHeight > sectionTop && scrolled < sectionTop + sectionHeight) {
                    // Calculate offset relative to when section hits top of viewport
                    const distance = (scrolled - sectionTop) * speed;
                    bg.style.transform = `translateY(${distance}px)`;
                }
            }
        });
    }

    window.addEventListener('scroll', () => {
        window.requestAnimationFrame(updateParallax);
    });


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


    // --- 4. PROJECTS: Filtering & Rendering ---

    const projects = [
        { id: 1, name: "Control Mouse with Hand Gesture Detection", tools: "Python, OpenCV, MediaPipe", category: ["python", "ai"], icon: ["fab fa-python", "fas fa-robot"], brief: "Computer vision system for touchless interaction recognizing real-time hand gestures.", img: "assets/images/hand_gestures.png" },
        { id: 2, name: "Credit Card Fraud Detection Using ML", tools: "Python, Scikit-learn, Pandas, NumPy", category: ["python", "ai"], icon: ["fab fa-python", "fas fa-robot"], brief: "Machine learning classification model built to detect fraudulent financial transactions.", img: "assets/images/fraud_detection.png" },
        { id: 3, name: "Tutor LMS Platform (Internship)", tools: "React JS, WordPress, HTML/CSS", category: ["web", "react"], icon: ["fab fa-react", "fab fa-wordpress"], brief: "Developed responsive interfaces and customized platform modules with AI-driven tools.", img: "assets/images/tutor_lms.png" },
        { id: 4, name: "Department Conference Website Development", tools: "HTML, CSS, JavaScript, Figma", category: ["web"], icon: ["fab fa-html5", "fab fa-css3-alt", "fab fa-figma"], brief: "Designed and developed a static web page for an international conference organized by the department.", img: "assets/images/conference_website.png" }
    ];

    const projectsGrid = document.getElementById('projects-grid');

    window.filterProjects = function (category, btn) {
        // Active Class
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Render
        projectsGrid.innerHTML = '';
        const filtered = category === 'all' ? projects : projects.filter(p => p.category.includes(category));

        filtered.forEach(p => {
            const iconsHtml = p.icon.map(i => `<i class="${i}"></i>`).join(' ');
            const card = document.createElement('div');
            card.className = 'project-card fade-up visible'; // Add visible immediately for filter re-render
            card.style.cursor = 'pointer'; // Make it clear it's clickable
            card.onclick = () => openProjectModal(p.id); // Trigger modal
            card.innerHTML = `
                <div class="card-img-container"><img src="${p.img}" class="card-img" alt="${p.name}"></div>
                <div class="project-title">${p.name}</div>
                <div class="tech-icons" style="margin-bottom:8px;">${iconsHtml}</div>
                <div style="color:var(--neon-blue); font-size:0.85rem; font-weight:600; margin-bottom:8px; font-family:'Share Tech Mono', monospace;">TOOLS: <span style="color:white; font-family:'Inter', sans-serif; font-weight:400;">${p.tools}</span></div>
                <div style="flex-grow:1; color:#bbb; margin-bottom:5px; font-size:0.9rem;">${p.brief}</div>
            `;
            projectsGrid.appendChild(card);
        });
    };

    // Modal interaction logic
    window.openProjectModal = function (id) {
        const project = projects.find(p => p.id === id);
        if (!project) return;

        // Populate modal data
        document.getElementById('p-modal-title').innerText = project.name;
        document.getElementById('p-modal-icons').innerHTML = project.icon.map(i => `<i class="${i}"></i>`).join(' ');
        document.getElementById('p-modal-tools').innerText = project.tools;
        // In the future you can swap .brief for a deeper .description text property on the array too!
        document.getElementById('p-modal-desc').innerText = project.brief;
        document.getElementById('p-modal-img').src = project.img;

        // Open modal & lock background scrolling
        document.getElementById('project-modal').classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    window.closeProjectModal = function () {
        document.getElementById('project-modal').classList.remove('open');
        document.body.style.overflow = ''; // Restore scrolling
    };

    // Initial Load
    filterProjects('all', document.querySelector('.filter-btn.active'));





    // --- 6. MOBILE NAVIGATION Logic ---
    window.toggleMobileMenu = function () {
        const overlay = document.getElementById('mobileNav');
        overlay.classList.toggle('active');
    };

    // --- Utility: Star Generator ---
    function createStars(containerId, count) {
        const container = document.getElementById(containerId);
        if (!container) return;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.position = 'absolute';
            star.style.background = 'white';
            star.style.borderRadius = '50%';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.opacity = Math.random();
            star.style.animation = `twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`;
            container.appendChild(star);
        }
    }

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


// --- 9. HERO: Shooting Stars & Comets ---
function initShootingStars() {
    const container = document.getElementById('shooting-stars-container');
    if (!container) return;

    function createShootingStar() {
        const star = document.createElement('div');
        star.classList.add('shooting-star');

        // Random Start Position
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight * 0.5; // Top half mostly

        // Random Angle (Downwards diagonal)
        const angle = Math.random() * 45 + 135; // 135 to 180 degrees (approx) representing top-left to bottom-right or similar

        // Random Length/Distance
        const length = Math.random() * 300 + 500; // 500px to 800px travel

        // Calculate End Position based on angle
        // Angle is in degrees, convert to radians
        const rad = angle * (Math.PI / 180);
        const tx = Math.cos(rad) * length;
        const ty = Math.sin(rad) * length;

        // Random Duration
        const duration = Math.random() * 1.5 + 1; // 1s to 2.5s

        // Set Styles
        star.style.left = `${startX}px`;
        star.style.top = `${startY}px`;
        star.style.setProperty('--angle', `${angle}deg`);
        star.style.setProperty('--tx', `${tx}px`);
        star.style.setProperty('--ty', `${ty}px`);
        star.style.animationDuration = `${duration}s`;

        container.appendChild(star);

        // Remove after animation
        setTimeout(() => {
            star.remove();
        }, duration * 1000);
    }

    // Launch a new star every random interval
    setInterval(() => {
        if (Math.random() > 0.3) { // 70% chance to spawn, prevents flood
            createShootingStar();
        }
    }, 800); // Check every 800ms
}

document.addEventListener('DOMContentLoaded', () => {
    initShootingStars();
});

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

