# Dutch Blitz Simulator

A lightweight JavaScript/HTML simulation and analytics engine for the Dutch Blitz card game featuring intelligent bots, real-time visualization, and comprehensive statistics tracking.

## Features

- **4 Intelligent Bots**: Each with different strategies (aggressive vs balanced)
- **Real-time Game Visualization**: Live updates of all game states, card positions, and player actions
- **Comprehensive Statistics**: Track plays per player, round duration, win rates, and performance metrics
- **Interactive Controls**: Start/pause/resume games, single-step through moves, adjustable speed
- **Console Logging**: Detailed game state logging for analysis and debugging
- **Authentic Gameplay**: Faithful implementation of Dutch Blitz rules and mechanics

## Game Rules

Dutch Blitz is a fast-paced card game where players race to empty their "Blitz pile":

- **Goal**: First player to empty their 10-card Blitz pile wins
- **Card Setup**: Each player has 40 cards (4 colors × 10 values)
  - Blitz pile: 10 cards face down, top card face up
  - Draw pile: 30 cards, drawn 3 at a time
  - Post piles: 3 personal piles for building sequences
- **Dutch Piles**: 4 shared foundation piles (one per color) that build up from 1 to 10
- **Post Piles**: Personal piles that build down in any color sequence

## How to Run

1. **Simple Local Server**:
   ```bash
   # Navigate to the project directory
   cd dutch-blitz-sim
   
   # Start a local web server (Python 3)
   python3 -m http.server 8000
   
   # Or using Python 2
   python -m SimpleHTTPServer 8000
   
   # Or using Node.js
   npx http-server -p 8000
   ```

2. **Open in Browser**: Navigate to `http://localhost:8000`

3. **Start Playing**: Click "Start New Game" to begin the simulation

## Controls

- **Start New Game**: Initialize a new round with fresh card distributions
- **Pause**: Pause the current game
- **Resume**: Resume a paused game
- **Single Step**: Execute one turn manually (useful for analysis)
- **Speed Control**: Adjust game speed from "Very Fast" to "Very Slow"

## Game Display

The interface shows:

- **Game Status**: Current round, duration, and game state
- **Dutch Piles**: Shared foundation piles showing top cards and count
- **Player Sections**: Each bot's individual game state including:
  - Blitz pile size (goal: reduce to 0)
  - Draw pile size
  - Revealed cards from draw pile
  - Three Post piles with top cards
  - Play statistics and strategy type
- **Statistics Table**: Win rates, average plays per game, total plays
- **Console Output**: Real-time game logging and state changes

## Bot Strategies

- **Aggressive Bots**: Prioritize clearing their Blitz pile and playing to Dutch piles
- **Balanced Bots**: More varied strategy with randomized decision-making

## File Structure

```
dutch-blitz-sim/
├── index.html           # Main HTML interface
├── dutchBlitzGame.js    # Core game engine and bot AI
├── app.js              # UI controller and browser integration
└── README.md           # This file
```

## Technical Implementation

- **Pure JavaScript**: No external dependencies, runs in any modern browser
- **Modular Design**: Separate game engine, UI controller, and bot AI
- **Real-time Updates**: Efficient DOM manipulation for smooth gameplay
- **Console Integration**: Custom console redirection for in-browser logging
- **Responsive Design**: Works on desktop and tablet devices

## Game Mechanics Implemented

- ✅ Complete card deck management (40 cards per player)
- ✅ Dutch pile building rules (1-10 sequences by color)
- ✅ Post pile building rules (descending sequences, any color)
- ✅ Draw pile cycling (3-card reveals)
- ✅ Win condition detection (empty Blitz pile)
- ✅ Stalemate detection (no available moves)
- ✅ Move validation and priority systems
- ✅ Statistics tracking and analytics

## Extension Points

The simulator is designed to be easily extensible:

- **New Bot Strategies**: Modify `SimpleBot.getMovePriority()` for different AI behaviors
- **Additional Players**: Adjust player count in `DutchBlitzGame` constructor
- **Custom Rules**: Modify game rules in the `Card` and `Player` classes
- **Enhanced UI**: Add more visual elements or animations
- **Data Export**: Add JSON export for game statistics
- **Tournament Mode**: Implement multi-round tournaments

## Statistics Tracked

- Total games played
- Average round duration
- Win rates per player
- Average plays per game per player
- Total career plays per player
- Real-time round statistics

## Development

The codebase follows clean architecture principles:

- **Game Engine** (`dutchBlitzGame.js`): Pure game logic, no UI dependencies
- **UI Controller** (`app.js`): Handles browser integration and display updates
- **HTML Interface** (`index.html`): Responsive layout with embedded CSS

To modify or extend the simulator, focus on the appropriate layer:
- Game rules and AI: Edit `dutchBlitzGame.js`
- Display and controls: Edit `app.js` and `index.html`
- Styling: Modify the CSS in the HTML `<style>` section

## License

Open source - feel free to modify and extend for your own Dutch Blitz simulations and analysis!
