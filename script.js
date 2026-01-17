document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GLOBAL: Scroll Animations & Navigation ---

    // Smooth Scroll for Nav Links handled by scroll-nav click listeners below
    /* Removed old anchor listener to avoid conflict/redundancy */

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
                scrollLabel.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // Scroll Down (Text First = Top in vertical mode)
                scrollLabel.innerHTML = '<span>Scroll Down</span><i class="fas fa-chevron-down"></i>';
                scrollLabel.onclick = () => {
                    const nextIndex = activeIndex + 1;
                    if (nextIndex < sections.length) {
                        sections[nextIndex].scrollIntoView({ behavior: 'smooth' });
                    }
                };
            }
        }
    }

    window.addEventListener('scroll', updateActiveScroll);
    updateActiveScroll(); // Initial check

    // Click handler for Scroll Nav
    scrollLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetId = link.dataset.target;
            document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
        });
    });

    /**
     * STAGGERED REVEAL ANIMATION (Character by Character)
     * Matches typical high-end portfolio animations.
     */
    function splitTextForAnimation(element) {
        if (element.classList.contains('split-done')) return;
        const text = element.innerText;
        element.innerHTML = '';
        element.classList.add('split-done'); // Mark as done to avoid re-splitting

        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.innerText = char === ' ' ? '\u00A0' : char; // Preserve spaces
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.transform = 'translateY(20px)'; // Start position
            span.style.transition = `all 0.6s cubic-bezier(0.21, 1.00, 0.35, 1.00) ${index * 0.05}s`; // Staggered delay
            element.appendChild(span);
        });
    }

    function triggerReveal(element) {
        const spans = element.querySelectorAll('span');
        spans.forEach(span => {
            span.style.opacity = '1';
            span.style.transform = 'translateY(0)';
        });
    }

    // Fade Up Animation on Scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Trigger Reveal Animation for Headings
                const headings = entry.target.querySelectorAll('h1, h2, h3, .section-title, .hero-role');
                headings.forEach(heading => {
                    // Split first if not already (safeguard)
                    splitTextForAnimation(heading);

                    // Force a tiny reflow/delay to ensure transitions catch the initial state
                    setTimeout(() => {
                        triggerReveal(heading);
                    }, 50);
                });

                // Trigger Path Animation if Journey Section
                if (entry.target.id === 'journey' || entry.target.querySelector('#journey')) {
                    const pathColumn = document.querySelector('.path-column');
                    if (pathColumn) pathColumn.classList.add('visible');
                }
            }
        });
    }, { threshold: 0.2 }); /* Increased threshold for better visibility trigger */

    document.querySelectorAll('.fade-up, .fade-left, .fade-right, .zoom-in, section').forEach((el) => {
        observer.observe(el);
        // Pre-split text for any headings inside observed elements to setup initial state
        const headings = el.querySelectorAll('h1, h2, h3, .section-title, .hero-role');
        headings.forEach(h => splitTextForAnimation(h));
    });


    // --- 2. HERO: Background Stars ---
    createStars('star-container-hero', 200);
    // Global Stars (Less dense)
    createStars('global-stars', 100);


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
        planetsWrapper.classList.add('paused');

        // Animate Progress Bar after card is visible
        setTimeout(() => {
            skillProgress.style.width = data.percent;
        }, 300);
    };

    window.closeSkillCard = function () {
        skillCard.classList.remove('open');
        planetsWrapper.classList.remove('paused');
    };


    // --- 4. PROJECTS: Filtering & Rendering ---

    const projects = [
        { id: 1, name: "Project Alpha", category: ["react"], icon: ["fab fa-react"], brief: "Real-time data visualization dashboard.", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500" },
        { id: 2, name: "Project Beta", category: ["python", "db"], icon: ["fab fa-python", "fas fa-database"], brief: "Backend API for E-commerce.", img: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&w=500" },
        { id: 3, name: "Project Gamma", category: ["web"], icon: ["fab fa-html5", "fab fa-js"], brief: "Interactive Portfolio Interface.", img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=500" },
        { id: 4, name: "Social Dash", category: ["react", "db"], icon: ["fab fa-react", "fas fa-database"], brief: "Social media manager with auth.", img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=500" },
        { id: 5, name: "Chat App", category: ["node", "js"], icon: ["fab fa-node-js", "fab fa-js"], brief: "Real-time websocket chat.", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=500" },
        { id: 6, name: "Landing Page", category: ["web", "react"], icon: ["fab fa-css3-alt", "fab fa-react"], brief: "High-conversion landing page.", img: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=500" }
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
            card.innerHTML = `
                <div class="card-img-container"><img src="${p.img}" class="card-img" alt="${p.name}"></div>
                <div class="project-title">${p.name}</div>
                <div class="tech-icons">${iconsHtml}</div>
                <div style="flex-grow:1; color:#bbb; margin-bottom:15px; font-size:0.9rem;">${p.brief}</div>
                <div class="card-buttons">
                    <a href="#" class="btn-card">Demo</a>
                    <a href="#" class="btn-card">Code</a>
                </div>
            `;
            projectsGrid.appendChild(card);
        });
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
});
