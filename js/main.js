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
                this.initGamesFeed();
                break;
            case '/profile':
                break;
            case '/Challenges':
                break;
        }
    }

    initGamesFeed() {
        const gamesFeed = document.getElementById('gamesFeed');
        if (!gamesFeed) return;

        // Games array
        const games = [
            {
                id: 1,
                name: 'Billiards 2 Play',
                swfPath: './assets/games/2_billiards-2-play/2_billiards_2_play.swf',
                thumbnail: './assets/games/2_billiards-2-play/__ia_thumb.jpg',
                description: 'Classic 2-player billiards game'
            },
            {
                id: 2,
                name: 'Sample Game 2',
                swfPath: './assets/games/2_billiards-2-play/2_billiards_2_play.swf',
                thumbnail: './assets/games/2_billiards-2-play/__ia_thumb.jpg',
                description: 'Another exciting game'
            },
            {
                id: 3,
                name: 'Sample Game 3',
                swfPath: './assets/games/sample-game3/game.swf',
                thumbnail: './assets/games/sample-game3/thumb.jpg',
                description: 'Third sample game'
            }
        ];

        // Get template
        const template = document.querySelector('.game-container');
        if (!template) return;

        // Clear feed
        gamesFeed.innerHTML = '';

        // Create game containers
        games.forEach((game) => {
            const gameContainer = template.cloneNode(true);
            
            gameContainer.dataset.gameId = game.id;
            gameContainer.dataset.gameName = game.name;
            
            // Set up object tag
            const objectEl = gameContainer.querySelector('object');
            if (objectEl) {
                objectEl.setAttribute('data', game.swfPath);
                objectEl.setAttribute('type', 'application/x-shockwave-flash');
            }
            
            // Add content to left column
            const leftCol = gameContainer.querySelector('.col.left');
            if (leftCol) {
                leftCol.innerHTML = `
                    <div style="text-align: center; width: 100%;">
                        <img src="${game.thumbnail}" 
                             alt="${game.name}"
                             style="width: 100%; max-width: 150px; height: auto; border-radius: 8px; margin-bottom: 10px; border: 2px solid rgba(255,255,255,0.2);"
                             onerror="this.src='assets/games/placeholder.jpg'">
                        <h3 style="font-size: 18px; margin: 10px 0 5px; color: white;">${game.name}</h3>
                        <p style="font-size: 14px; opacity: 0.8; margin: 0; color: white;">${game.description}</p>
                    </div>
                `;
            }
            
            // Add content to right column
            const rightCol = gameContainer.querySelector('.col.right');
            if (rightCol) {
                rightCol.innerHTML = `
                    <div style="text-align: center; color: white;">
                        <button onclick="router.loadGame(${game.id})" 
                                style="background: #F6AE4E; border: none; color: white; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-bottom: 10px;">
                            Play
                        </button>
                        <div style="font-size: 12px; opacity: 0.6;">
                            <div>❤️ 123</div>
                            <div>▶️ ${game.id}K plays</div>
                        </div>
                    </div>
                `;
            }
            
            gamesFeed.appendChild(gameContainer);
        });

        console.log(`✅ Loaded ${games.length} games`);
    }

    loadGame(gameId) {
        console.log(`Loading game ${gameId}`);
        // Optional: Implement fullscreen or dedicated view
        const gameContainer = document.querySelector(`[data-game-id="${gameId}"]`);
        if (gameContainer) {
            gameContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }
    async show404() {
        this.app.innerHTML = `
            <div class="error-page">
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <button onclick="router.navigateTo('/')">Go Home</button>
            </div>
        `;
    }

    showError(error, file) {
        this.app.innerHTML = `
            <div class="error-page">
                <h1>Error Loading Page</h1>
                <p>Could not load ${file}</p>
                <p style="color: #ff6b6b; margin-top: 10px;">${error.message}</p>
                <button onclick="router.navigateTo('/')">Go Home</button>
            </div>
        `;
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