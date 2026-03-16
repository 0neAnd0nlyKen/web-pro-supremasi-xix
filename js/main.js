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
            '/challenges': 'pages/challengesTest.html',
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
            '/challenges': 'Challenges - FLISH FLASH',
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
            case '/challenges':
                this.initChallengesPage();
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
    initChallengesPage() {
        const topicList = document.getElementById('topicList');
        const topicSelector = document.getElementById('topicSelector');
        const slidesContainer = document.getElementById('slidesContainer');
        
        if (!topicList || !topicSelector || !slidesContainer) return;

        // Fetch challenges data
        fetch('assets/challenges.json')
            .then(response => response.json())
            .then(data => {
                this.challengesData = data;
                
                // Render topic list
                this.renderTopicList(data.topics);
            })
            .catch(error => {
                console.error('Error loading challenges:', error);
                slidesContainer.innerHTML = '<div class="slide">Failed to load challenges</div>';
            });
    }

    renderTopicList(topics) {
        const topicList = document.getElementById('topicList');
        topicList.innerHTML = '';

        // Small SVG placeholder as a fallback image
        const placeholderSvg = `data:image/svg+xml;base64,${btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="240">
                <rect width="100%" height="100%" fill="#2b2d42" />
                <text x="50%" y="50%" fill="#edf2f4" font-family="system-ui, sans-serif" font-size="72" text-anchor="middle" dominant-baseline="middle">?</text>
            </svg>
        `)}`;

        topics.forEach((topic, index) => {
            const card = document.createElement('div');
            card.className = 'topic-card';
            card.dataset.topicIndex = index;

            const badge = document.createElement('div');
            badge.className = 'topic-card-badge';
            badge.textContent = topic.title?.trim()?.[0]?.toUpperCase() || '';

            const img = document.createElement('img');
            img.alt = `${topic.title} thumbnail`;
            img.src = `assets/challenges/${topic.title.toLowerCase()}/a.png`;
            img.onerror = () => {
                img.src = placeholderSvg;
            };

            const body = document.createElement('div');
            body.className = 'topic-card-body';

            const title = document.createElement('div');
            title.className = 'topic-card-title';
            title.textContent = topic.title;

            body.appendChild(title);
            card.appendChild(badge);
            card.appendChild(img);
            card.appendChild(body);

            card.addEventListener('click', (e) => {
                // Hide topic list
                topicList.style.display = 'none';

                // Show topic selector
                document.getElementById('topicSelector').style.display = 'flex';

                // Render topic buttons
                this.renderTopicButtons(topics);

                // Set active button for selected topic
                const buttons = document.querySelectorAll('.topic-btn');
                buttons.forEach((btn, i) => {
                    if (i === index) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });

                // Render slides for selected topic
                this.renderSlides(topic);
            });

            topicList.appendChild(card);
        });
    }

    renderTopicButtons(topics) {
        const topicSelector = document.getElementById('topicSelector');
        topicSelector.innerHTML = '';
        
        topics.forEach((topic, index) => {
            const btn = document.createElement('button');
            btn.className = 'topic-btn';
            btn.textContent = topic.title;
            btn.dataset.topicIndex = index;
            
            btn.addEventListener('click', (e) => {
                // Update active button
                document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Render slides for selected topic
                this.renderSlides(topics[parseInt(e.target.dataset.topicIndex)]);
            });
            
            topicSelector.appendChild(btn);
        });
    }

    renderSlides(topic) {
        const slidesContainer = document.getElementById('slidesContainer');
        slidesContainer.innerHTML = '';
        
        const types = Object.keys(topic.slides);
        
        types.forEach((type, typeIndex) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'slide';
            slideDiv.dataset.type = type;
            slideDiv.dataset.typeIndex = typeIndex;
            
            const subSlides = topic.slides[type];
            let currentSubIndex = 0;
            
            // Create content container
            const contentContainer = document.createElement('div');
            contentContainer.className = 'slide-content';
            
            // Create navigation buttons
            const navDiv = document.createElement('div');
            navDiv.className = 'slide-navigation';
            
            const prevBtn = document.createElement('button');
            prevBtn.className = 'nav-btn prev-btn';
            prevBtn.textContent = '← Previous';
            prevBtn.disabled = currentSubIndex === 0;
            
            const nextBtn = document.createElement('button');
            nextBtn.className = 'nav-btn next-btn';
            nextBtn.textContent = 'Next →';
            nextBtn.disabled = subSlides.length <= 1;
            
            const counter = document.createElement('span');
            counter.className = 'slide-counter';
            counter.textContent = `${currentSubIndex + 1} / ${subSlides.length}`;
            
            navDiv.appendChild(prevBtn);
            navDiv.appendChild(counter);
            navDiv.appendChild(nextBtn);
            
            // Function to render current sub-slide
            const renderCurrentSubSlide = () => {
                contentContainer.innerHTML = '';
                const subSlide = subSlides[currentSubIndex];
                
                switch(type) {
                    case 'material':
                        contentContainer.innerHTML = subSlide.content;
                        break;
                        
                    case 'quiz':
                        contentContainer.innerHTML = this.renderQuiz(subSlide);
                        this.attachQuizHandlers(contentContainer, subSlide);
                        break;
                        
                    case 'external':
                        contentContainer.innerHTML = `
                            <div class="external-card">
                                ${subSlide.content}
                                <a href="${subSlide.link}" target="_blank" class="external-link">Open Project</a>
                            </div>
                        `;
                        break;
                }
                
                counter.textContent = `${currentSubIndex + 1} / ${subSlides.length}`;
                prevBtn.disabled = currentSubIndex === 0;
                nextBtn.disabled = currentSubIndex === subSlides.length - 1;
            };
            
            // Attach navigation handlers
            prevBtn.addEventListener('click', () => {
                if (currentSubIndex > 0) {
                    currentSubIndex--;
                    renderCurrentSubSlide();
                }
            });
            
            nextBtn.addEventListener('click', () => {
                if (currentSubIndex < subSlides.length - 1) {
                    currentSubIndex++;
                    renderCurrentSubSlide();
                }
            });
            
            // Initial render
            renderCurrentSubSlide();
            
            slideDiv.appendChild(contentContainer);
            slideDiv.appendChild(navDiv);
            slidesContainer.appendChild(slideDiv);
        });
    }

    renderQuiz(slide) {
        return `
            <div class="quiz-container">
                <div class="quiz-question">${slide.question}</div>
                <div class="quiz-answers">
                    <div class="chooseAnswer" data-answer="1">A. ${slide.answerA}</div>
                    <div class="chooseAnswer" data-answer="2">B. ${slide.answerB}</div>
                    <div class="chooseAnswer" data-answer="3">C. ${slide.answerC}</div>
                    <div class="chooseAnswer" data-answer="4">D. ${slide.answerD}</div>
                </div>
                <div class="explanation-box correct" id="correctExplanation">
                    ${slide.explanationRight}
                </div>
                <div class="explanation-box wrong" id="wrongExplanation">
                    ${slide.explanationWrong}
                </div>
            </div>
        `;
    }

    attachQuizHandlers(container, slide) {
        const answers = container.querySelectorAll('.chooseAnswer');
        const correctBox = container.querySelector('#correctExplanation');
        const wrongBox = container.querySelector('#wrongExplanation');
        
        answers.forEach(answer => {
            answer.addEventListener('click', (e) => {
                // Prevent multiple answers
                if (container.querySelector('.chooseAnswer.correct') || 
                    container.querySelector('.chooseAnswer.wrong')) {
                    return;
                }
                
                const selectedAnswer = parseInt(e.target.dataset.answer);
                const isCorrect = (selectedAnswer === slide.rightAnswer);
                
                // Mark selected answer
                e.target.classList.add(isCorrect ? 'correct' : 'wrong');
                
                // Show appropriate explanation
                if (isCorrect) {
                    correctBox.classList.add('visible');
                } else {
                    wrongBox.classList.add('visible');
                    
                    // Also highlight the correct answer
                    answers.forEach(a => {
                        if (parseInt(a.dataset.answer) === slide.rightAnswer) {
                            a.classList.add('correct');
                        }
                    });
                }
            });
        });
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