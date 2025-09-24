/**
 * Dutch Blitz Simulator App
 * Connects the game engine to the HTML interface
 */

class DutchBlitzApp {
    constructor() {
        this.game = new DutchBlitzGame(4); // 4 players by default
        this.gameInterval = null;
        this.gameSpeed = 500; // milliseconds between moves
        this.isPaused = false;
        
        // Redirect console.log to our console display
        this.originalConsoleLog = console.log;
        this.consoleOutput = [];
        this.bindConsole();
        
        this.initializeUI();
        this.bindEvents();
    }

    bindConsole() {
        console.log = (...args) => {
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            
            this.consoleOutput.push(message);
            this.updateConsoleDisplay();
            
            // Also log to browser console for debugging
            this.originalConsoleLog(...args);
        };
    }

    updateConsoleDisplay() {
        const consoleElement = document.getElementById('console');
        // Keep only the last 50 lines to prevent memory issues
        if (this.consoleOutput.length > 50) {
            this.consoleOutput = this.consoleOutput.slice(-50);
        }
        consoleElement.textContent = this.consoleOutput.join('\n');
        consoleElement.scrollTop = consoleElement.scrollHeight;
    }

    initializeUI() {
        this.updateGameDisplay();
        this.createPlayerDisplays();
    }

    bindEvents() {
        document.getElementById('startGame').addEventListener('click', () => this.startNewGame());
        document.getElementById('pauseGame').addEventListener('click', () => this.pauseGame());
        document.getElementById('resumeGame').addEventListener('click', () => this.resumeGame());
        document.getElementById('stepGame').addEventListener('click', () => this.stepGame());
        document.getElementById('gameSpeed').addEventListener('change', (e) => {
            this.gameSpeed = parseInt(e.target.value);
        });
    }

    createPlayerDisplays() {
        const container = document.getElementById('playersContainer');
        container.innerHTML = '';

        for (let player of this.game.players) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player';
            playerDiv.id = `player-${player.name.replace(/\s+/g, '-')}`;
            
            playerDiv.innerHTML = `
                <h4>${player.name}</h4>
                <div class="pile">Blitz Pile: <span class="blitz-count">0</span> cards</div>
                <div class="pile">Draw Pile: <span class="draw-count">0</span> cards</div>
                <div class="pile">Revealed: <span class="revealed-cards"></span></div>
                <div class="pile">Post Pile 1: <span class="post-1"></span></div>
                <div class="pile">Post Pile 2: <span class="post-2"></span></div>
                <div class="pile">Post Pile 3: <span class="post-3"></span></div>
                <div>Plays this round: <span class="plays-count">0</span></div>
                <div>Total plays: <span class="total-plays">0</span></div>
                <div>Strategy: <span class="strategy">${player.strategy || 'N/A'}</span></div>
            `;
            
            container.appendChild(playerDiv);
        }
    }

    updateGameDisplay() {
        const state = this.game.getGameState();
        
        // Update game status
        let status = 'Ready to start';
        if (state.gameActive) {
            status = this.isPaused ? 'Paused' : 'Running';
        } else if (state.winner) {
            status = `${state.winner.name} Won!`;
        } else if (state.roundNumber > 0) {
            status = 'Round Ended';
        }
        
        document.getElementById('gameStatus').textContent = status;
        document.getElementById('roundNumber').textContent = state.roundNumber;
        document.getElementById('roundDuration').textContent = state.roundDuration;

        // Update Dutch piles
        for (let color of ['red', 'blue', 'green', 'yellow']) {
            const pile = state.dutchPiles[color];
            const element = document.getElementById(`dutch-${color}`);
            if (pile.length === 0) {
                element.innerHTML = '<span class="card">Empty</span>';
            } else {
                const topCard = pile[pile.length - 1];
                element.innerHTML = `<span class="card ${color}">${topCard.toString()}</span> (${pile.length} cards)`;
            }
        }

        // Update player displays
        for (let player of state.players) {
            const playerId = `player-${player.name.replace(/\s+/g, '-')}`;
            const playerElement = document.getElementById(playerId);
            
            if (playerElement) {
                // Update winner styling
                if (state.winner === player) {
                    playerElement.classList.add('winner');
                } else {
                    playerElement.classList.remove('winner');
                }

                // Update card counts and displays
                playerElement.querySelector('.blitz-count').textContent = player.blitzPile.length;
                playerElement.querySelector('.draw-count').textContent = player.drawPile.length;
                playerElement.querySelector('.plays-count').textContent = player.playsThisRound;
                playerElement.querySelector('.total-plays').textContent = player.totalPlays;

                // Update revealed cards
                const revealedElement = playerElement.querySelector('.revealed-cards');
                if (player.drawRevealed.length === 0) {
                    revealedElement.innerHTML = '<span class="card">None</span>';
                } else {
                    revealedElement.innerHTML = player.drawRevealed.map(card => 
                        `<span class="card ${card.color}">${card.toString()}</span>`
                    ).join('');
                }

                // Update post piles
                for (let i = 0; i < 3; i++) {
                    const postElement = playerElement.querySelector(`.post-${i + 1}`);
                    const postPile = player.postPiles[i];
                    if (postPile.length === 0) {
                        postElement.innerHTML = '<span class="card">Empty</span>';
                    } else {
                        const topCard = postPile[postPile.length - 1];
                        postElement.innerHTML = `<span class="card ${topCard.color}">${topCard.toString()}</span> (${postPile.length})`;
                    }
                }
            }
        }

        // Update statistics
        this.updateStatsDisplay(state.stats);
        
        // Update button states
        this.updateButtonStates(state);
    }

    updateStatsDisplay(stats) {
        const statsElement = document.getElementById('gameStats');
        
        if (stats.totalGames === 0) {
            statsElement.innerHTML = '<p>No games played yet.</p>';
            return;
        }

        let html = `
            <div><strong>Total Games:</strong> ${stats.totalGames}</div>
            <div><strong>Average Round Duration:</strong> ${stats.averageRoundDuration} seconds</div>
            <h4>Player Statistics</h4>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background-color: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 8px;">Player</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Wins</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Win Rate</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Avg Plays/Game</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Total Plays</th>
                </tr>
        `;

        for (let [playerName, playerStats] of Object.entries(stats.playerStats)) {
            const winRate = stats.totalGames > 0 ? Math.round((playerStats.wins / stats.totalGames) * 100) : 0;
            html += `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${playerName}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${playerStats.wins}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${winRate}%</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${playerStats.averagePlaysPerGame}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${playerStats.totalPlays}</td>
                </tr>
            `;
        }

        html += '</table>';
        statsElement.innerHTML = html;
    }

    updateButtonStates(state) {
        const startBtn = document.getElementById('startGame');
        const pauseBtn = document.getElementById('pauseGame');
        const resumeBtn = document.getElementById('resumeGame');
        const stepBtn = document.getElementById('stepGame');

        if (state.gameActive && !this.isPaused) {
            startBtn.disabled = false;
            startBtn.textContent = this.gameInterval ? 'Restart Game' : 'Start New Game';
            pauseBtn.disabled = false;
            resumeBtn.disabled = true;
            stepBtn.disabled = true;
        } else if (state.gameActive && this.isPaused) {
            startBtn.disabled = false;
            startBtn.textContent = 'Restart Game';
            pauseBtn.disabled = true;
            resumeBtn.disabled = false;
            stepBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            startBtn.textContent = 'Start New Game';
            pauseBtn.disabled = true;
            resumeBtn.disabled = true;
            stepBtn.disabled = true;
        }
    }

    startNewGame() {
        this.stopGame();
        this.isPaused = false;
        this.game.startNewRound();
        this.updateGameDisplay();
        
        // Start the game loop
        this.gameInterval = setInterval(() => {
            if (!this.isPaused) {
                const gameEnded = this.game.playTurn();
                this.updateGameDisplay();
                
                if (gameEnded) {
                    this.stopGame();
                }
            }
        }, this.gameSpeed);
    }

    pauseGame() {
        this.isPaused = true;
        this.updateGameDisplay();
    }

    resumeGame() {
        this.isPaused = false;
        this.updateGameDisplay();
    }

    stepGame() {
        if (this.game.gameActive) {
            const gameEnded = this.game.playTurn();
            this.updateGameDisplay();
            
            if (gameEnded) {
                this.stopGame();
            }
        }
    }

    stopGame() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        this.updateGameDisplay();
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DutchBlitzApp();
    console.log('🎮 Dutch Blitz Simulator loaded!');
    console.log('Click "Start New Game" to begin a simulation.');
    console.log('');
    console.log('Game Rules:');
    console.log('- Each player starts with 40 cards (10 per color)');
    console.log('- Goal: Empty your Blitz pile (10 cards) first');
    console.log('- Dutch piles (shared): Build up 1-10 by color');
    console.log('- Post piles (personal): Build down, any color');
    console.log('- Players are simple bots with different strategies');
});