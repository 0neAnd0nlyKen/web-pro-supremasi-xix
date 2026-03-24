// SPA Router with HTML File Loading
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
        
        this.gamesMetadata = null;

        this.likes = [];
        this.challengesProgress = {};
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
                this.initProfilePage();
                break;
            case '/challenges':
                this.initChallengesPage();
                break;
        }
    }

    initGamesFeed() {
        const gameIds = [
            'homerun_20201126',
            // 'stick-rpg-complete',
            'cannibals-missioneries',
            // 'swords-and-sandals-2',
            // 'bloxors',
            'candy-bar-adventure-1'
        ];

        const gamesFeed = document.querySelector('.games-feed');
        if (!gamesFeed) return;

        const template = gamesFeed.querySelector('.game-wrapper');
        if (!template) return;

        // Keep a fresh clone template and clear the base template from DOM
        const baseTemplate = template.cloneNode(true);
        gamesFeed.innerHTML = '';

        fetch('/assets/games-metadata.json')
            .then(response => response.json())
            .then(data => {
                this.gamesMetadata = data;

                gameIds.forEach((gameId) => {
                    const gameInfo = this.gamesMetadata[gameId];
                    if (!gameInfo) {
                        console.warn(`Game metadata missing for ${gameId}`);
                        return;
                    }

                    const metadata = gameInfo.metadata || {};
                    const swfFile = gameInfo.swf_file;
                    const swfPath = `assets/games/${gameId}/${swfFile}`;
                    // const swfFile = "assets/games/a-koopas-revenge-2/a koopa's revenge 2.swf";
                    // const swfPath = `https://archive.org/download/${gameId}/${swfFile}`;

                    const gameContainer = baseTemplate.cloneNode(true);
                    gameContainer.dataset.gameId = gameId;
                    gameContainer.dataset.gameName = metadata.title || gameId;

                    const objectEl = gameContainer.querySelector('object');
                    if (objectEl) {
                        console.log(`Setting SWF path for ${gameId}: ${swfPath}`);
                        objectEl.setAttribute('data', `${swfPath}`); // "example -> games/homerun.swf"
                        objectEl.setAttribute('type', 'application/x-shockwave-flash');
                    }

                    const titleEl = gameContainer.querySelector('.title');
                    if (titleEl) titleEl.textContent = metadata.title || gameId;

                    const yearEl = gameContainer.querySelector('.year');
                    if (yearEl && metadata.publicdate) {
                        let year = metadata.publicdate;
                        const parsed = new Date(metadata.publicdate);
                        if (!Number.isNaN(parsed.getTime())) year = parsed.getFullYear();
                        yearEl.textContent = `Year: ${year}`;
                    } else if (yearEl) {
                        yearEl.textContent = '';
                    }

                    const creatorEl = gameContainer.querySelector('.creator-label');
                    const creator = metadata.creator || metadata.uploader || 'Unknown creator';
                    if (creatorEl) creatorEl.textContent = `Created by: ${creator}`;

                    const descriptionEl = gameContainer.querySelector('.description');
                    if (descriptionEl) descriptionEl.innerHTML = metadata.description || 'No description available.';

                    const genresEl = gameContainer.querySelector('.genres');
                    const genres = Array.isArray(gameInfo.genres) ? gameInfo.genres : (metadata.subject && Array.isArray(metadata.subject) ? metadata.subject : []);
                    if (genresEl) genresEl.textContent = `Genres: ${genres.length ? genres.join(', ') : 'N/A'}`;

                    const likesCountEl = gameContainer.querySelector('.likes-count');
                    const likesBtn = gameContainer.querySelector('.likes-btn');

                    let totalLikes = (gameInfo.all_time_views || 0);

                    if (likesBtn) {
                        likesBtn.addEventListener('click', () => {
                            if (!this.likes.includes(gameId)) {
                                this.likes.push(gameId);
                                likesBtn.classList.add('liked');
                                likesCountEl.textContent = `${totalLikes + 1}`;
                            } else {
                                this.likes.splice(this.likes.indexOf(gameId), 1);
                                likesBtn.classList.remove('liked');
                                likesCountEl.textContent = `${totalLikes}`;
                            }
                            console.log('Liked games:', this.likes);
                        });
                    }
                    
                    if (this.likes.includes(gameId)) {
                        if (likesBtn) likesBtn.classList.add('liked');
                        if (likesCountEl) likesCountEl.textContent = `${totalLikes + 1}`;
                    } else {
                        if (likesCountEl) likesCountEl.textContent = `${totalLikes}`;

                    }


                    const commentsCountEl = gameContainer.querySelector('.comments-count');
                    if (commentsCountEl) commentsCountEl.textContent = `${(gameInfo.reviews || []).length} reviews`;

                    const screenshotsContainer = gameContainer.querySelector('.screenshots-container');
                    if (screenshotsContainer) {
                        const screenshots = Array.isArray(gameInfo.screenshot_paths) 
                            ? gameInfo.screenshot_paths.map(src => ({ 
                                url: src.startsWith('http') ? src : src 
                              }))
                            : [];
                        
                        screenshotsContainer.innerHTML = '';
                        
                        if (screenshots.length) {
                            const row1 = document.createElement('div');
                            row1.className = 'screenshots-row';
                            
                            const row2 = document.createElement('div');
                            row2.className = 'screenshots-row';
                            
                            const midPoint = Math.ceil(screenshots.length / 2);
                            const firstRowScreenshots = screenshots.slice(0, midPoint);
                            const secondRowScreenshots = screenshots.slice(midPoint);
                            
                            [firstRowScreenshots, secondRowScreenshots].forEach((rowScreenshots, rowIndex) => {
                                const row = rowIndex === 0 ? row1 : row2;
                                
                                rowScreenshots.forEach((screenshot, index) => {
                                    const screenshotDiv = document.createElement('div');
                                    screenshotDiv.className = 'screenshot';
                                    screenshotDiv.dataset.index = rowIndex === 0 ? index : index + midPoint;
                                    
                                    const img = document.createElement('img');
                                    img.src = screenshot.url;
                                    img.alt = `${metadata.title || gameId} screenshot ${screenshotDiv.dataset.index + 1}`;
                                    img.onerror = () => {
                                        screenshotDiv.innerHTML = '📸';
                                    };
                                    
                                    screenshotDiv.appendChild(img);
                                    screenshotDiv.addEventListener('click', () => {
                                        console.log('Open screenshot:', screenshot.url);
                                    });
                                    
                                    row.appendChild(screenshotDiv);
                                });
                            });
                            
                            if (firstRowScreenshots.length > 0) screenshotsContainer.appendChild(row1);
                            if (secondRowScreenshots.length > 0) screenshotsContainer.appendChild(row2);
                        } else {
                            const screenshotDiv = document.createElement('div');
                            screenshotDiv.className = 'screenshot';
                            screenshotDiv.textContent = 'No screenshots available';
                            screenshotsContainer.appendChild(screenshotDiv);
                        }
                    }

                    const commentsList = gameContainer.querySelector('.comments-list');
                    if (commentsList) {
                        const commentsCountDisplay = commentsCountEl || document.createElement('div');
                        commentsCountDisplay.className = 'comments-count';

                        const renderComments = () => {
                            commentsList.innerHTML = '';

                            const reviewsEl = document.createElement('div');
                            reviewsEl.className = 'reviews';

                            const comments = gameInfo.reviews;
                            if(Array.isArray(this.comments[gameId])) comments.push(...this.comments[gameId]);
                            else this.comments[gameId] = [];
                            
                            // comments.concat(this.comments[gameId]? this.comments[gameId] : []);
                            if (comments.length > 0) {
                                comments.forEach((review) => {
                                    const reviewEl = document.createElement('div');
                                    reviewEl.className = 'review';
                                    reviewEl.innerHTML = `
                                        <strong>${review.reviewtitle || 'Untitled review'}</strong>
                                        <p>${review.reviewbody || ''}</p>
                                        <small>by ${review.reviewer || 'Anonymous'} on ${review.reviewdate || 'unknown date'}</small>
                                    `;
                                    reviewsEl.appendChild(reviewEl);
                                });
                            } else {
                                const emptyReview = document.createElement('div');
                                emptyReview.className = 'review';
                                emptyReview.textContent = 'No reviews available.';
                                reviewsEl.appendChild(emptyReview);
                            }

                            commentsList.appendChild(reviewsEl);

                            commentsCountDisplay.textContent = `${comments.length} review${comments.length === 1 ? '' : 's'}`;
                            commentsList.appendChild(commentsCountDisplay);

                            const commentForm = document.createElement('form');
                            commentForm.className = 'comment-form';
                            commentForm.innerHTML = `
                                <input type="text" class="comment-input" placeholder="Write a comment..." aria-label="Write a comment" />
                                <button type="submit">Post</button>
                            `;

                            const inputEl = commentForm.querySelector('.comment-input');

                            commentForm.addEventListener('submit', (event) => {
                                event.preventDefault();
                                const text = inputEl.value.trim();
                                if (!text) return;

                                this.comments[gameId].push({
                                    reviewtitle: 'User comment',
                                    reviewbody: text,
                                    reviewer: 'You',
                                    reviewdate: new Date().toLocaleString()
                                });

                                inputEl.value = '';
                                renderComments();
                            });

                            commentsList.appendChild(commentForm);
                        };

                        renderComments();
                    }

                    gamesFeed.appendChild(gameContainer);
                });

                console.log(`✅ Loaded ${gameIds.length} games`);
            })
            .catch(error => {
                console.error('Error loading games metadata:', error);
                gamesFeed.innerHTML = '<div class="slide">Failed to load games metadata</div>';
            });
    }

    loadGame(gameId) {
        console.log(`Loading game ${gameId}`);
        // Optional: Implement fullscreen or dedicated view
        const gameContainer = document.querySelector(`[data-game-id="${gameId}"]`);
        if (gameContainer) {
            gameContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }


    initProfilePage() {
        // Add profile page specific functionality
        const editButton = document.querySelector('.edit-profile-btn');
        if (editButton) {
            editButton.addEventListener('click', () => {
                alert('Edit profile functionality would go here!');
            });
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
            // Initialize progress tracking for this topic
            if (!this.challengesProgress[topic.title]) {
                this.challengesProgress[topic.title] = {};
                Object.keys(topic.slides).forEach(type => {
                    this.challengesProgress[topic.title][type] = {};
                    topic.slides[type].forEach((_, idx) => {
                        this.challengesProgress[topic.title][type][idx] = false;
                    });
                });
            }
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
        
        const markSlideCompleted = (type, idx) => {
            if (!this.challengesProgress[topic.title] || !this.challengesProgress[topic.title][type]) return;
            if (this.challengesProgress[topic.title][type][idx]) return;
            this.challengesProgress[topic.title][type][idx] = true;
            console.log(`🏁 Progress marked: [${topic.title}] ${type}[${idx}]`);
        };
        
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
                        if (currentSubIndex === 0) {
                            // first material slide gets auto-completed on render
                            markSlideCompleted(type, 0);
                        }
                        break;

                    case 'quiz':
                        contentContainer.innerHTML = this.renderQuiz(subSlide);
                        this.attachQuizHandlers(contentContainer, subSlide, topic.title, type, currentSubIndex, markSlideCompleted);
                        break;

                    case 'external':
                        contentContainer.innerHTML = `
                            <div class="external-card">
                                ${subSlide.content}
                                <a href="${subSlide.link}" target="_blank" class="external-link">Open Project</a>
                            </div>
                        `;
                        const externalLink = contentContainer.querySelector('.external-link');
                        if (externalLink) {
                            externalLink.addEventListener('click', () => {
                                markSlideCompleted(type, currentSubIndex);
                            });
                        }
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
                    markSlideCompleted(type, currentSubIndex);
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

    attachQuizHandlers(container, slide, topicTitle, type, slideIndex, markSlideCompleted) {
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
                
                if (isCorrect) {
                    markSlideCompleted(type, slideIndex);
                }
                
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