class InsectHunter {
    constructor() {
        this.screens = {
            loading: document.getElementById('loadingScreen'),
            menu: document.getElementById('menuScreen'),
            selection: document.getElementById('selectionScreen'),
            game: document.getElementById('gameScreen'),
            ranking: document.getElementById('rankingScreen'),
            settings: document.getElementById('settingsScreen')
        };
        
        this.gameArea = document.getElementById('gameArea');
        this.timeEl = document.getElementById('gameTime');
        this.scoreEl = document.getElementById('gameScore');
        this.comboEl = document.getElementById('gameCombo');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.gameOverModal = document.getElementById('gameOverModal');
        
        this.state = {
            running: false,
            paused: false,
            score: 0,
            time: 0,
            combo: 1,
            maxCombo: 1,
            selectedInsect: null,
            difficulty: 'normal',
            soundEnabled: true,
            musicEnabled: true,
            insects: [],
            gameInterval: null,
            spawnInterval: null
        };
        
        this.insectsData = {
            fly: { src: 'http://pngimg.com/uploads/fly/fly_PNG3946.png', points: 10, speed: 1 },
            mosquito: { src: 'http://pngimg.com/uploads/mosquito/mosquito_PNG18175.png', points: 15, speed: 1.5 },
            spider: { src: 'http://pngimg.com/uploads/spider/spider_PNG12.png', points: 20, speed: 0.8 },
            roach: { src: 'http://pngimg.com/uploads/roach/roach_PNG12163.png', points: 25, speed: 2 }
        };
        
        this.ranking = this.loadRanking();
        this.init();
    }
    
    init() {
        this.createParticles();
        this.setupEventListeners();
        this.hideLoading();
    }
    
    createParticles() {
        const particlesContainer = document.getElementById('particles');
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.width = Math.random() * 5 + 'px';
            particle.style.height = particle.style.width;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = Math.random() * 10 + 10 + 's';
            particlesContainer.appendChild(particle);
        }
    }
    
    setupEventListeners() {
        // Menu buttons
        document.getElementById('playBtn').addEventListener('click', () => this.showScreen('selection'));
        document.getElementById('rankingBtn').addEventListener('click', () => this.showRanking());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showScreen('settings'));
        
        // Back buttons
        document.getElementById('backFromSelection').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('backFromRanking').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('backFromSettings').addEventListener('click', () => this.showScreen('menu'));
        
        // Insect selection
        document.querySelectorAll('.insect-card').forEach(card => {
            card.addEventListener('click', () => this.selectInsect(card.dataset.insect));
        });
        
        // Pause controls
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('menuBtn').addEventListener('click', () => this.returnToMenu());
        
        // Game over modal
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('menuFromGameOver').addEventListener('click', () => this.returnToMenu());
        
        // Settings
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.state.soundEnabled = e.target.checked;
        });
        
        document.getElementById('musicToggle').addEventListener('change', (e) => {
            this.state.musicEnabled = e.target.checked;
        });
        
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            this.state.difficulty = e.target.value;
        });
        
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.code === 'Space') {
                e.preventDefault();
                if (this.screens.game.classList.contains('active') && this.state.running) {
                    this.togglePause();
                }
            }
            
            if (e.key === 'r' && this.screens.game.classList.contains('active')) {
                this.restartGame();
            }
        });
    }
    
    selectInsect(insectType) {
        this.state.selectedInsect = this.insectsData[insectType];
        this.showScreen('game');
        this.startGame();
    }
    
    startGame() {
        // Reset state
        this.state.running = true;
        this.state.paused = false;
        this.state.score = 0;
        this.state.time = 0;
        this.state.combo = 1;
        this.state.maxCombo = 1;
        this.state.insects = [];
        
        // Update UI
        this.updateScore();
        this.updateTime();
        this.updateCombo();
        this.pauseMenu.classList.remove('active');
        
        // Clear existing insects
        this.gameArea.innerHTML = '';
        
        // Start game loops
        this.state.gameInterval = setInterval(() => this.updateTime(), 1000);
        this.startSpawning();
    }
    
    startSpawning() {
        const spawnRate = {
            easy: 1500,
            normal: 1000,
            hard: 500
        }[this.state.difficulty];
        
        this.state.spawnInterval = setInterval(() => {
            if (this.state.running && !this.state.paused) {
                this.createInsect();
            }
        }, spawnRate);
    }
    
    createInsect() {
        if (!this.state.selectedInsect) return;
        
        const insect = document.createElement('div');
        insect.className = 'insect';
        
        const { x, y } = this.getRandomPosition();
        insect.style.top = `${y}px`;
        insect.style.left = `${x}px`;
        
        const rotation = Math.random() * 360;
        const speed = this.state.selectedInsect.speed * {
            easy: 0.5,
            normal: 1,
            hard: 1.5
        }[this.state.difficulty];
        
        insect.innerHTML = `
            <img 
                src="${this.state.selectedInsect.src}" 
                alt="insect"
                style="transform: rotate(${rotation}deg)"
                data-speed="${speed}"
            >
        `;
        
        insect.addEventListener('click', (e) => this.catchInsect(e, insect));
        
        this.gameArea.appendChild(insect);
        this.state.insects.push(insect);
        
        // Start movement animation
        this.moveInsect(insect, speed);
    }
    
    moveInsect(insect, speed) {
        const moveInterval = setInterval(() => {
            if (!this.state.running || this.state.paused || !insect.parentNode) {
                clearInterval(moveInterval);
                return;
            }
            
            const currentTop = parseFloat(insect.style.top);
            const currentLeft = parseFloat(insect.style.left);
            
            // Random movement
            const newTop = currentTop + (Math.random() - 0.5) * speed * 10;
            const newLeft = currentLeft + (Math.random() - 0.5) * speed * 10;
            
            // Keep within bounds
            const maxTop = window.innerHeight - 50;
            const maxLeft = window.innerWidth - 50;
            
            insect.style.top = `${Math.min(Math.max(50, newTop), maxTop)}px`;
            insect.style.left = `${Math.min(Math.max(50, newLeft), maxLeft)}px`;
        }, 50);
        
        // Store interval for cleanup
        insect.moveInterval = moveInterval;
    }
    
    catchInsect(e, insect) {
        e.stopPropagation();
        
        if (!this.state.running || this.state.paused) return;
        
        // Play sound
        if (this.state.soundEnabled) {
            this.playSound('catch');
        }
        
        // Add hit effect
        insect.classList.add('hit');
        setTimeout(() => insect.classList.remove('hit'), 200);
        
        // Update score with combo
        const points = this.state.selectedInsect.points * this.state.combo;
        this.state.score += points;
        this.state.combo++;
        this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
        
        // Show floating points
        this.showFloatingPoints(e.clientX, e.clientY, `+${points}`);
        
        // Remove insect
        clearInterval(insect.moveInterval);
        insect.remove();
        
        // Remove from array
        const index = this.state.insects.indexOf(insect);
        if (index > -1) this.state.insects.splice(index, 1);
        
        this.updateScore();
        this.updateCombo();
    }
    
    showFloatingPoints(x, y, text) {
        const points = document.createElement('div');
        points.style.position = 'absolute';
        points.style.left = x + 'px';
        points.style.top = y + 'px';
        points.style.color = 'var(--accent)';
        points.style.fontWeight = 'bold';
        points.style.fontSize = '24px';
        points.style.textShadow = '0 0 10px var(--accent)';
        points.style.zIndex = '100';
        points.style.animation = 'floatUp 1s ease forwards';
        points.textContent = text;
        
        this.gameArea.appendChild(points);
        
        setTimeout(() => points.remove(), 1000);
    }
    
    getRandomPosition() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const x = Math.random() * (width - 150) + 75;
        const y = Math.random() * (height - 150) + 75;
        return { x, y };
    }
    
    updateScore() {
        this.scoreEl.textContent = this.state.score;
    }
    
    updateTime() {
        const minutes = Math.floor(this.state.time / 60);
        const seconds = this.state.time % 60;
        this.timeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.state.time++;
    }
    
    updateCombo() {
        this.comboEl.textContent = `x${this.state.combo}`;
        
        if (this.state.combo > 1) {
            this.comboEl.style.color = 'var(--accent)';
        } else {
            this.comboEl.style.color = '';
        }
    }
    
    togglePause() {
        this.state.paused = !this.state.paused;
        this.pauseMenu.classList.toggle('active', this.state.paused);
    }
    
    restartGame() {
        // Stop all intervals
        clearInterval(this.state.gameInterval);
        clearInterval(this.state.spawnInterval);
        
        // Remove all insects
        this.state.insects.forEach(insect => {
            clearInterval(insect.moveInterval);
            insect.remove();
        });
        
        // Hide modals
        this.gameOverModal.classList.remove('active');
        this.pauseMenu.classList.remove('active');
        
        // Start new game
        this.startGame();
    }
    
    returnToMenu() {
        // Stop game
        this.state.running = false;
        clearInterval(this.state.gameInterval);
        clearInterval(this.state.spawnInterval);
        
        // Remove all insects
        this.state.insects.forEach(insect => {
            clearInterval(insect.moveInterval);
            insect.remove();
        });
        
        // Hide modals
        this.gameOverModal.classList.remove('active');
        this.pauseMenu.classList.remove('active');
        
        // Show menu
        this.showScreen('menu');
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        
        this.screens[screenName].classList.add('active');
    }
    
    showRanking() {
        this.updateRankingDisplay();
        this.showScreen('ranking');
    }
    
    updateRankingDisplay() {
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = '';
        
        const sortedRanking = [...this.ranking].sort((a, b) => b.score - a.score).slice(0, 10);
        
        sortedRanking.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'ranking-item';
            item.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="score">${entry.score}</span>
                <span class="date">${entry.date}</span>
            `;
            rankingList.appendChild(item);
        });
    }
    
    saveScore() {
        const entry = {
            score: this.state.score,
            date: new Date().toLocaleDateString(),
            combo: this.state.maxCombo
        };
        
        this.ranking.push(entry);
        localStorage.setItem('insectHunterRanking', JSON.stringify(this.ranking));
        
        // Show game over
        document.getElementById('finalScore').textContent = this.state.score;
        document.getElementById('finalTime').textContent = this.timeEl.textContent;
        document.getElementById('finalCombo').textContent = `x${this.state.maxCombo}`;
        this.gameOverModal.classList.add('active');
    }
    
    loadRanking() {
        const saved = localStorage.getItem('insectHunterRanking');
        return saved ? JSON.parse(saved) : [];
    }
    
    playSound(sound) {
        // Sound implementation would go here
        console.log(`Playing sound: ${sound}`);
    }
    
    hideLoading() {
        setTimeout(() => {
            this.screens.loading.classList.add('hidden');
        }, 2000);
    }
}

// Add floating animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translateY(0);
        }
        100% {
            opacity: 0;
            transform: translateY(-50px);
        }
    }
`;
document.head.appendChild(style);

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new InsectHunter();
});