class SPARouter {
    constructor() {
        this.app = document.getElementById('app');
        this.menuItems = document.querySelectorAll('.menu-item');
        this.currentRoute = '/';
        
        // Page cache for better performance
        this.pageCache = new Map();
        
        // Map routes to HTML files in the pages folder
        this.routes = {
            '/': 'pages/home.html',
            '/Challenges': 'pages/Challenges.html',
            '/profile': 'pages/profile.html',
            '/games': 'pages/games.html',
            '/videos': 'pages/videos.html'
        };
        
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.menuToggle = document.getElementById('menuToggle');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        
        this.init();
        this.initSidebar();
    }

    init() {
        // Handle menu clicks
        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const route = item.dataset.route;
                this.navigateTo(route);
                this.closeSidebar();
            });
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            this.loadRoute(window.location.pathname || '/');
        });

        // Load initial route
        const initialRoute = window.location.pathname || '/';
        this.navigateTo(initialRoute, false);
        
        // Make router available globally
        window.router = this;
    }

    initSidebar() {
        this.menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebar();
        });

        this.sidebarOverlay.addEventListener('click', () => {
            this.closeSidebar();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.sidebar.classList.contains('visible')) {
                this.closeSidebar();
            }
        });
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('visible');
        this.sidebarOverlay.classList.toggle('visible');
        this.menuToggle.classList.toggle('open');
        
        if (this.sidebar.classList.contains('visible')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    closeSidebar() {
        this.sidebar.classList.remove('visible');
        this.sidebarOverlay.classList.remove('visible');
        this.menuToggle.classList.remove('open');
        document.body.style.overflow = '';
    }

    navigateTo(route, addToHistory = true) {
        this.menuItems.forEach(item => {
            item.classList.toggle('active', item.dataset.route === route);
        });

        this.loadRoute(route);

        if (addToHistory) {
            history.pushState({}, '', route);
        }
        
        this.updateTitle(route);
    }

    updateTitle(route) {
        const titles = {
            '/': 'Home - FLISH FLASH',
            '/Challenges': 'Challenges - FLISH FLASH',
            '/profile': 'Profile - FLISH FLASH',
            '/games': 'Games - FLISH FLASH',
            '/videos': 'Videos - FLISH FLASH'
        };
        document.title = titles[route] || 'FLISH FLASH';
    }

    async loadRoute(route) {
        this.currentRoute = route;
        this.app.innerHTML = '<div class="loading">Loading...</div>';

        const htmlFile = this.routes[route];
        
        if (!htmlFile) {
            await this.show404();
            return;
        }

        try {
            if (this.pageCache.has(htmlFile)) {
                this.app.innerHTML = this.pageCache.get(htmlFile);
            } else {
                const response = await fetch(htmlFile);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const html = await response.text();
                this.pageCache.set(htmlFile, html);
                this.app.innerHTML = html;
            }
            
            this.initPageFunctions(route);
            
        } catch (error) {
            console.error('Error loading page:', error);
            this.showError(error, htmlFile);
        }
    }

    initPageFunctions(route) {
        switch(route) {
            case '/games':
                break;
            case '/profile':
                break;
            case '/Challenges':
                break;
        }
    }
// Initialize the router
const router = new SPARouter();

// Handle anchor links
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('/')) {
        e.preventDefault();
        router.navigateTo(e.target.getAttribute('href'));
        router.closeSidebar();
    }
});