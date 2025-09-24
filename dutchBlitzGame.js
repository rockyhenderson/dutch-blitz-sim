/**
 * Dutch Blitz Game Engine
 * 
 * Dutch Blitz is a fast-paced card game where players race to empty their "Blitz pile".
 * Each player has:
 * - Blitz pile: 10 cards face down, top card face up (goal is to empty this)
 * - Post piles: 3 face-up piles where players can play cards
 * - Draw pile: remaining cards, drawn 3 at a time
 * 
 * Shared Dutch piles (foundation): 4 piles (one per color) that build from 1 to 10
 * Players can play to Dutch piles or their own Post piles
 */

class Card {
    constructor(value, color) {
        this.value = value; // 1-10
        this.color = color; // 'red', 'blue', 'green', 'yellow'
    }

    toString() {
        return `${this.value}${this.color.charAt(0).toUpperCase()}`;
    }

    canPlayOn(targetCard) {
        if (!targetCard) return this.value === 1; // Empty pile, must start with 1
        return this.color === targetCard.color && this.value === targetCard.value + 1;
    }

    canPostOn(targetCard) {
        if (!targetCard) return true; // Empty post pile, any card can go
        return this.value === targetCard.value - 1; // Post piles build down
    }
}

class Player {
    constructor(name, isBot = true) {
        this.name = name;
        this.isBot = isBot;
        this.blitzPile = [];
        this.postPiles = [[], [], []]; // 3 post piles
        this.drawPile = [];
        this.drawRevealed = []; // Up to 3 cards revealed from draw pile
        this.playsThisRound = 0;
        this.totalPlays = 0;
        this.wins = 0;
    }

    initializeCards() {
        // Create a deck of 40 cards per player (4 colors, 10 values each)
        const deck = [];
        const colors = ['red', 'blue', 'green', 'yellow'];
        
        for (let color of colors) {
            for (let value = 1; value <= 10; value++) {
                deck.push(new Card(value, color));
            }
        }

        // Shuffle the deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        // Deal cards
        this.blitzPile = deck.slice(0, 10); // First 10 cards to blitz pile
        this.drawPile = deck.slice(10); // Remaining cards to draw pile
        this.drawRevealed = [];
        this.postPiles = [[], [], []];
        this.playsThisRound = 0;
        
        // Ensure we have some "1" cards accessible by drawing initial cards
        this.drawCards();
    }

    getTopBlitzCard() {
        return this.blitzPile.length > 0 ? this.blitzPile[this.blitzPile.length - 1] : null;
    }

    getAvailableCards() {
        const available = [];
        
        // Top of blitz pile
        const blitzCard = this.getTopBlitzCard();
        if (blitzCard) {
            available.push({ card: blitzCard, source: 'blitz' });
        }

        // Top of each post pile
        for (let i = 0; i < this.postPiles.length; i++) {
            const pile = this.postPiles[i];
            if (pile.length > 0) {
                available.push({ card: pile[pile.length - 1], source: 'post', pileIndex: i });
            }
        }

        // Revealed draw cards
        for (let i = 0; i < this.drawRevealed.length; i++) {
            available.push({ card: this.drawRevealed[i], source: 'draw', drawIndex: i });
        }

        return available;
    }

    drawCards() {
        // Draw up to 3 cards from draw pile to revealed
        if (this.drawPile.length === 0 && this.drawRevealed.length === 0) return false;
        
        if (this.drawRevealed.length === 0 && this.drawPile.length > 0) {
            // Reveal new cards when revealed pile is empty
            for (let i = 0; i < 3 && this.drawPile.length > 0; i++) {
                this.drawRevealed.push(this.drawPile.pop());
            }
            return true;
        } else if (this.drawPile.length > 0) {
            // Cycle through draw pile - put revealed cards back and draw new ones
            this.drawPile.unshift(...this.drawRevealed.reverse());
            this.drawRevealed = [];
            for (let i = 0; i < 3 && this.drawPile.length > 0; i++) {
                this.drawRevealed.push(this.drawPile.pop());
            }
            return true;
        }
        
        // No more cards available
        return false;
    }

    playCard(card, source, dutchPiles, targetPostPile = null) {
        if (targetPostPile !== null) {
            // Playing to own post pile
            const targetPile = this.postPiles[targetPostPile];
            const topCard = targetPile.length > 0 ? targetPile[targetPile.length - 1] : null;
            
            if (!card.canPostOn(topCard)) return false;
            
            targetPile.push(card);
            this.removeCardFromSource(card, source);
            this.playsThisRound++;
            this.totalPlays++;
            return true;
        } else {
            // Playing to Dutch pile
            const dutchPile = dutchPiles[card.color];
            const topCard = dutchPile.length > 0 ? dutchPile[dutchPile.length - 1] : null;
            
            if (!card.canPlayOn(topCard)) return false;
            
            dutchPile.push(card);
            this.removeCardFromSource(card, source);
            this.playsThisRound++;
            this.totalPlays++;
            return true;
        }
    }

    removeCardFromSource(card, source) {
        if (source.source === 'blitz') {
            this.blitzPile.pop();
        } else if (source.source === 'post') {
            this.postPiles[source.pileIndex].pop();
        } else if (source.source === 'draw') {
            this.drawRevealed.splice(source.drawIndex, 1);
        }
    }

    hasWon() {
        return this.blitzPile.length === 0;
    }

    canMakeMove(dutchPiles) {
        const available = this.getAvailableCards();
        
        for (let {card, source} of available) {
            // Check if can play to Dutch piles
            const dutchPile = dutchPiles[card.color];
            const topDutchCard = dutchPile.length > 0 ? dutchPile[dutchPile.length - 1] : null;
            if (card.canPlayOn(topDutchCard)) return true;
            
            // Check if can play to own post piles
            for (let i = 0; i < this.postPiles.length; i++) {
                const postPile = this.postPiles[i];
                const topPostCard = postPile.length > 0 ? postPile[postPile.length - 1] : null;
                if (card.canPostOn(topPostCard)) return true;
            }
        }
        
        return false;
    }
}

class SimpleBot extends Player {
    constructor(name) {
        super(name, true);
        this.strategy = Math.random() < 0.5 ? 'aggressive' : 'balanced'; // Random strategy
    }

    makeMove(dutchPiles) {
        // First check if we need to draw cards to get access to more options
        if (this.drawRevealed.length === 0 && this.drawPile.length > 0) {
            this.drawCards();
        }
        
        const available = this.getAvailableCards();
        const moves = [];

        // Collect all possible moves
        for (let availableCard of available) {
            const {card, source} = availableCard;
            
            // Check Dutch pile moves first (highest priority)
            const dutchPile = dutchPiles[card.color];
            const topDutchCard = dutchPile.length > 0 ? dutchPile[dutchPile.length - 1] : null;
            if (card.canPlayOn(topDutchCard)) {
                moves.push({
                    card, source, target: 'dutch', priority: this.getMovePriority(card, source, 'dutch')
                });
            }

            // Check post pile moves - only if we have cards to build down from
            for (let i = 0; i < this.postPiles.length; i++) {
                const postPile = this.postPiles[i];
                const topPostCard = postPile.length > 0 ? postPile[postPile.length - 1] : null;
                if (card.canPostOn(topPostCard)) {
                    // Don't fill post piles unnecessarily if the card value is too high
                    // This prevents clogging post piles with high cards when we need low ones
                    if (!topPostCard || card.value < 8 || topPostCard.value - card.value >= 2) {
                        moves.push({
                            card, source, target: 'post', postPile: i, 
                            priority: this.getMovePriority(card, source, 'post')
                        });
                    }
                }
            }
        }

        if (moves.length === 0) {
            // Try to draw more cards to find new opportunities
            const drewCards = this.drawCards();
            return drewCards; // Return true if we drew cards, false if we can't
        }

        // Sort moves by priority and make the best one
        moves.sort((a, b) => b.priority - a.priority);
        const bestMove = moves[0];

        if (bestMove.target === 'dutch') {
            return this.playCard(bestMove.card, bestMove.source, dutchPiles);
        } else {
            return this.playCard(bestMove.card, bestMove.source, dutchPiles, bestMove.postPile);
        }
    }

    getMovePriority(card, source, target) {
        let priority = 0;
        
        // Much higher priority for starting Dutch piles with "1" cards
        if (target === 'dutch' && card.value === 1) {
            priority += 200; // Very high priority for starting Dutch piles
        }
        
        // Higher priority for playing from blitz pile (main goal)
        if (source.source === 'blitz') priority += 100;
        
        // Higher priority for Dutch pile moves (scores points and clears cards)
        if (target === 'dutch') priority += 50;
        
        // Lower value cards have higher priority (easier to play subsequent cards)
        priority += (11 - card.value) * 5;
        
        // Strategy-based priorities
        if (this.strategy === 'aggressive') {
            // Aggressive bots prioritize blitz pile clearing
            if (source.source === 'blitz') priority += 50;
            if (target === 'dutch') priority += 30;
        } else {
            // Balanced bots consider all moves more equally
            priority += Math.random() * 20; // Add some randomness
        }
        
        return priority;
    }
}

class DutchBlitzGame {
    constructor(playerCount = 4) {
        this.players = [];
        this.dutchPiles = {
            red: [],
            blue: [],
            green: [],
            yellow: []
        };
        this.gameActive = false;
        this.winner = null;
        this.roundStartTime = null;
        this.roundDuration = 0;
        this.roundNumber = 0;
        this.moveCount = 0;
        this.gameStats = {
            totalGames: 0,
            averageRoundDuration: 0,
            playerStats: {}
        };

        // Create players
        for (let i = 0; i < playerCount; i++) {
            const bot = new SimpleBot(`Bot ${i + 1}`);
            this.players.push(bot);
            this.gameStats.playerStats[bot.name] = {
                wins: 0,
                totalPlays: 0,
                averagePlaysPerGame: 0
            };
        }
    }

    startNewRound() {
        this.gameActive = true;
        this.winner = null;
        this.roundStartTime = Date.now();
        this.roundDuration = 0;
        this.roundNumber++;
        this.moveCount = 0;

        // Reset Dutch piles
        this.dutchPiles = {
            red: [],
            blue: [],
            green: [],
            yellow: []
        };

        // Initialize all players
        for (let player of this.players) {
            player.initializeCards();
        }

        console.log(`🎮 Starting Round ${this.roundNumber}`);
        this.logGameState();
    }

    playTurn() {
        if (!this.gameActive) return false;

        let anyPlayerMoved = false;
        let staleMateCounter = 0;

        // Each player gets a chance to make moves
        for (let player of this.players) {
            if (this.gameActive && !player.hasWon()) {
                // Let player make multiple moves if possible (like real Dutch Blitz)
                let movesMade = 0;
                let attempts = 0;
                const maxAttempts = 5; // Prevent infinite loops
                
                while (movesMade < 3 && attempts < maxAttempts && this.gameActive) {
                    const madeMoveThisTurn = player.makeMove(this.dutchPiles);
                    attempts++;
                    
                    if (madeMoveThisTurn) {
                        anyPlayerMoved = true;
                        movesMade++;
                        this.moveCount++;
                        
                        // Check for win condition
                        if (player.hasWon()) {
                            this.endRound(player);
                            return true;
                        }
                    } else {
                        // If player can't make a move, try drawing cards more aggressively
                        for (let drawAttempts = 0; drawAttempts < 2; drawAttempts++) {
                            if (player.drawCards()) {
                                // After drawing, try one more move
                                const postDrawMove = player.makeMove(this.dutchPiles);
                                if (postDrawMove) {
                                    anyPlayerMoved = true;
                                    movesMade++;
                                    this.moveCount++;
                                    
                                    if (player.hasWon()) {
                                        this.endRound(player);
                                        return true;
                                    }
                                    break;
                                }
                            } else {
                                staleMateCounter++;
                                break;
                            }
                        }
                        break; // No more moves available for this player
                    }
                }
            }
        }

        // Update round duration
        this.roundDuration = Math.floor((Date.now() - this.roundStartTime) / 1000);

        // Check if no one can make any moves (stalemate) - all players must be stuck
        if (!anyPlayerMoved && staleMateCounter >= this.players.length) {
            console.log("⚠️ Stalemate - no player can make any moves");
            this.endRound(null);
            return true;
        }

        // Log game state periodically for debugging
        if (this.moveCount % 20 === 0) {
            this.logGameState();
        }

        return anyPlayerMoved;
    }

    endRound(winner) {
        this.gameActive = false;
        this.winner = winner;
        this.roundDuration = Math.floor((Date.now() - this.roundStartTime) / 1000);

        if (winner) {
            winner.wins++;
            console.log(`🏆 ${winner.name} wins Round ${this.roundNumber}!`);
        } else {
            console.log(`🤝 Round ${this.roundNumber} ended in stalemate`);
        }

        // Update statistics
        this.updateStats();
        this.logRoundSummary();
    }

    updateStats() {
        this.gameStats.totalGames++;
        
        // Update average round duration
        const totalDuration = (this.gameStats.averageRoundDuration * (this.gameStats.totalGames - 1)) + this.roundDuration;
        this.gameStats.averageRoundDuration = Math.round(totalDuration / this.gameStats.totalGames);

        // Update player stats
        for (let player of this.players) {
            const stats = this.gameStats.playerStats[player.name];
            stats.wins = player.wins;
            stats.totalPlays = player.totalPlays;
            stats.averagePlaysPerGame = Math.round(player.totalPlays / this.gameStats.totalGames);
        }
    }

    logGameState() {
        console.log(`\n--- Game State (Round ${this.roundNumber}, Move ${this.moveCount}) ---`);
        console.log(`Dutch Piles: R:${this.dutchPiles.red.length} B:${this.dutchPiles.blue.length} G:${this.dutchPiles.green.length} Y:${this.dutchPiles.yellow.length}`);
        
        for (let player of this.players) {
            const blitzSize = player.blitzPile.length;
            const drawSize = player.drawPile.length;
            const revealedSize = player.drawRevealed.length;
            const postSizes = player.postPiles.map(p => p.length).join(',');
            console.log(`${player.name}: Blitz:${blitzSize} Draw:${drawSize}+${revealedSize} Posts:[${postSizes}] Plays:${player.playsThisRound}`);
        }
    }

    logRoundSummary() {
        console.log(`\n=== Round ${this.roundNumber} Summary ===`);
        console.log(`Duration: ${this.roundDuration} seconds`);
        console.log(`Total moves: ${this.moveCount}`);
        console.log(`Winner: ${this.winner ? this.winner.name : 'Stalemate'}`);
        
        console.log('\nPlayer Performance:');
        for (let player of this.players) {
            console.log(`${player.name}: ${player.playsThisRound} plays, ${player.blitzPile.length} cards left in blitz`);
        }

        console.log('\nOverall Stats:');
        console.log(`Games played: ${this.gameStats.totalGames}`);
        console.log(`Average round duration: ${this.gameStats.averageRoundDuration}s`);
        
        for (let [playerName, stats] of Object.entries(this.gameStats.playerStats)) {
            const winRate = this.gameStats.totalGames > 0 ? Math.round((stats.wins / this.gameStats.totalGames) * 100) : 0;
            console.log(`${playerName}: ${stats.wins} wins (${winRate}%), ${stats.averagePlaysPerGame} avg plays/game`);
        }
    }

    getGameState() {
        return {
            gameActive: this.gameActive,
            winner: this.winner,
            roundNumber: this.roundNumber,
            roundDuration: this.roundDuration,
            moveCount: this.moveCount,
            players: this.players,
            dutchPiles: this.dutchPiles,
            stats: this.gameStats
        };
    }
}