# Wordsaxe quick reference

```js
const {
    Board,
    BoardGenerator,
    Bot,
    Fiche,
    LettersGrid,
    MutableGrid,
    Player,
    Position,
    Round,
    RoundEntry,
    Rules,
    State,
    Utils,
    WordTheme
} = require("lib/wordsaxe");

// seed can be user specified, or 0 for random.
// same seed always produces the same game
const seed = 0;

// create a default rules handler
const rules = new Rules();

// create a dictionnary of words (with some metadata)
const words = WordTheme.fromJSON({
    id: "Animals",
    lang: "EN",
    words: Animals
});

// initialize a new game state
const state = r.newGame(4, [ "alice", "bob" ], w1);

console.log(state.currentPlayerName());
```
