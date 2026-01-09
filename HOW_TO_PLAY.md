# How to Play Game of Strife

## What is Game of Strife?

Game of Strife is a competitive strategy game based on Conway's Game of Life. You and your opponent place tokens on a grid, then watch them come to life and battle it out automatically. The player with the most living cells at the end wins!

---

## Quick Start

### Choose Your Mode

**Practice Mode** - Play against yourself to learn the game
- Great for learning strategies
- Test different patterns
- No waiting for an opponent

**Multiplayer Mode** - Play against another player online
- Create a room and share the code with a friend
- Or join an existing room with a code
- Real-time competitive play

---

## How to Place Tokens

### Your Turn

When it's your turn, you'll see "Your Turn" at the top of the screen. You can place tokens two ways:

**1. Tap to Place**
- Tap any empty cell to place a token
- Tap your own token to remove it (gets your token back)
- Each player takes turns placing one token at a time

**2. Drag to Place** (Faster!)
- Touch and drag your finger across the board
- Leaves a trail of tokens wherever you drag
- Great for creating patterns quickly

### Token Colors

- **Blue cells** = Player 1 (you in practice mode)
- **Green cells** = Player 2 (opponent or you in practice mode)
- **Special colored cells** = Superpower cells (appear randomly)

### Superpower Cells

Some tokens you place will randomly become "superpower" cells:
- They have colorful glowing borders
- They survive longer (have extra lives)
- Numbers on cells show remaining lives
- Each color does something different

---

## The Simulation

### What Happens

Once all tokens are placed, the simulation starts automatically:

1. **Cells come to life** - Your static tokens become living cells
2. **Conway's rules apply** - Cells are born, survive, or die based on their neighbors
3. **Generations advance** - The board evolves over time (up to 100 generations)
4. **Animation plays** - Watch your cells compete in real-time

### The Rules (Simple Version)

**Survival:**
- A living cell with 2 or 3 neighbors survives
- Too few neighbors (0-1) = death from loneliness
- Too many neighbors (4+) = death from overcrowding

**Birth:**
- A dead cell with exactly 3 neighbors becomes alive
- New cells inherit the color of the majority parent

**Superpower Lives:**
- Normal cells die immediately when conditions are met
- Superpower cells have extra lives (survive multiple deaths)
- Watch the numbers decrease as they take damage

---

## Winning

**Simple:** The player with the most living cells when the simulation ends wins!

The simulation stops when:
- 100 generations have passed, OR
- The board stabilizes (no more changes)

### Results Screen

After the simulation, you'll see:
- Who won
- Final cell counts
- How many generations ran
- Options to replay or start a new game

---

## Basic Strategy Tips

### Good Starting Patterns

**The Block** (2x2 square)
```
██
██
```
- Stable, never dies
- Good for defense

**The Blinker** (3 in a row)
```
███
```
- Oscillates (flips vertical/horizontal)
- Basic offense

**The Glider** (5 cells in L shape)
```
 █
  █
███
```
- Moves across the board diagonally
- Invades opponent territory

### General Tips

1. **Don't overcrowd** - Too many cells next to each other will die from overpopulation
2. **Don't isolate** - Single cells with no neighbors will die
3. **Create patterns** - Random placement usually loses
4. **Watch the edges** - The board wraps around! Cells can appear on the opposite side
5. **Use superpowers wisely** - Place special cells in important positions

---

## Common Questions

**Q: Can I undo a token placement?**
A: Yes! Tap your own token to remove it and get it back.

**Q: What if I run out of tokens?**
A: You can't place more until you remove some of your existing tokens.

**Q: Why did my cells die?**
A: Too many or too few neighbors. Try creating patterns with 2-3 neighbors per cell.

**Q: What do the numbers on cells mean?**
A: Those are remaining "lives" for superpower cells. They can survive multiple death events.

**Q: Can I speed up the simulation?**
A: Yes! Use the speed slider at the bottom during simulation.

**Q: The board edges wrap around?**
A: Yes! This is called a "toroidal board". A cell on the top edge has neighbors on the bottom edge.

---

## Ready to Play?

1. Open the app
2. Choose Practice Mode to learn
3. Set board size to 10x10 (default)
4. Place 20 tokens in interesting patterns
5. Watch the simulation
6. Learn from what works and what doesn't
7. Try Multiplayer when you're ready!

**Pro tip:** Start with Practice Mode and experiment with different patterns. Watch what happens and learn from each game. There's no penalty for losing - just try again!

---

## Need More Help?

- Check the Settings tab to customize your game
- Try different board sizes and token counts
- Experiment with different Conway's Life patterns
- Watch tutorials online about Conway's Game of Life for pattern ideas

**Have fun and may the best strategist win!** 🎮
