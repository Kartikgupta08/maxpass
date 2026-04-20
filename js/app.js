document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Mobile Menu Support
    const initMobileMenu = () => {
        const sidebar = document.querySelector('.sidebar');
        const brandMenuBtn = document.getElementById('sidebar-brand-menu-btn');
        const mainContent = document.querySelector('.main-content');
        const appContainer = document.querySelector('.app-container');
        const desktopCollapseKey = 'sidebarCollapsed';

        const applyDesktopSidebarState = () => {
            if (!sidebar || !mainContent) return;
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('collapsed');
                mainContent.classList.remove('sidebar-collapsed');
                return;
            }

            const isCollapsed = localStorage.getItem(desktopCollapseKey) === 'true';
            sidebar.classList.toggle('collapsed', isCollapsed);
            mainContent.classList.toggle('sidebar-collapsed', isCollapsed);
        };

        const toggleSidebar = (e) => {
            if (e) e.stopPropagation();
            if (!sidebar) return;

            if (window.innerWidth > 768) {
                const nextCollapsed = !sidebar.classList.contains('collapsed');
                sidebar.classList.toggle('collapsed', nextCollapsed);
                mainContent?.classList.toggle('sidebar-collapsed', nextCollapsed);
                localStorage.setItem(desktopCollapseKey, String(nextCollapsed));
                return;
            }

            sidebar.classList.toggle('active');
        };

        brandMenuBtn?.addEventListener('click', toggleSidebar);
        
        // Check if we need mobile menu (screen < 768px)
        const setupMobileMenu = () => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('active');
                return;
            }
            
            // Create hamburger button if it doesn't exist
            if (!document.getElementById('mobile-menu-btn')) {
                const btn = document.createElement('button');
                btn.id = 'mobile-menu-btn';
                btn.className = 'btn-icon';
                btn.setAttribute('aria-label', 'Toggle menu');
                btn.innerHTML = '<i data-lucide="menu"></i>';
                
                const pageHeader = document.querySelector('.page-header');
                if (pageHeader) {
                    pageHeader.insertBefore(btn, pageHeader.firstChild);
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
                
                btn.addEventListener('click', (e) => {
                    toggleSidebar(e);
                });
            }
        };
        
        setupMobileMenu();
        applyDesktopSidebarState();
        
        // Close menu on navigation link click
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                sidebar.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && e.target.id !== 'mobile-menu-btn') {
                sidebar.classList.remove('active');
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            setupMobileMenu();
            applyDesktopSidebarState();
        });
    };
    
    // 2. Theme Initialization
    const initTheme = () => {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (!toggleBtn) return;
        
        let currentTheme = localStorage.getItem('theme');
        if (!currentTheme) {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                currentTheme = 'dark';
            } else {
                currentTheme = 'light';
            }
        }
        
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeIcon(toggleBtn, currentTheme);

        toggleBtn.addEventListener('click', () => {
            currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', currentTheme);
            localStorage.setItem('theme', currentTheme);
            updateThemeIcon(toggleBtn, currentTheme);
            window.dispatchEvent(new Event('themeChanged'));
        });
    };

    const updateThemeIcon = (btn, theme) => {
        btn.innerHTML = theme === 'dark' 
            ? '<i data-lucide="sun"></i> Light Mode' 
            : '<i data-lucide="moon"></i> Dark Mode';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    initTheme();
    initMobileMenu();

    // 2. SPA Router Logic
    const routes = {
        '/dashboard': { render: window.RenderDashboard, init: window.InitDashboard },
        '/battery': { render: window.RenderBattery, init: window.InitBattery },
        '/cells': { render: window.RenderCells, init: window.InitCells, css: 'cells-css' },
        '/analytics': { render: window.RenderAnalytics, init: window.InitAnalytics, css: 'analytics-css' },
        '/alerts': { render: window.RenderAlerts, init: window.InitAlerts },
        '/map': { render: window.RenderMap, init: window.InitMap, css: 'map-css' }
    };

    const router = () => {
        let hash = window.location.hash.slice(1) || '/dashboard';
        
        // Clean up previous view specific logic (e.g. destroy charts, handle css)
        if(window.currentCleanup) window.currentCleanup();
        document.querySelectorAll('link[id$="-css"]').forEach(l => l.disabled = true);

        const route = routes[hash] || routes['/dashboard'];
        const contentDiv = document.getElementById('app-content');
        
        // Render HTML
        contentDiv.innerHTML = route.render();
        
        // Re-init lucide icons for newly injected HTML
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Enable specific CSS if required
        if (route.css) {
            const cssLink = document.getElementById(route.css);
            if(cssLink) cssLink.disabled = false;
        }

        // Initialize JavaScript for the current view
        if (route.init) window.currentCleanup = route.init();

        // Update active class on sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${hash}`) link.classList.add('active');
        });
    };

    // Listen to hash changes
    window.addEventListener('hashchange', router);
    
    // Initial routing
    router();
});
