(function ($hx_exports) { "use strict";
$hx_exports.wordsaxe = $hx_exports.wordsaxe || {};
var HxOverrides = function() { };
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(pos != null && pos != 0 && len != null && len < 0) return "";
	if(len == null) len = s.length;
	if(pos < 0) {
		pos = s.length + pos;
		if(pos < 0) pos = 0;
	} else if(len < 0) len = s.length + len - pos;
	return s.substr(pos,len);
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var IMap = function() { };
var Reflect = function() { };
Reflect.setProperty = function(o,field,value) {
	var tmp;
	if(o.__properties__ && (tmp = o.__properties__["set_" + field])) o[tmp](value); else o[field] = value;
};
var Std = function() { };
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
};
var StringBuf = function() {
	this.b = "";
};
var haxe = {};
haxe.StackItem = { __constructs__ : ["CFunction","Module","FilePos","Method","LocalFunction"] };
haxe.StackItem.CFunction = ["CFunction",0];
haxe.StackItem.CFunction.__enum__ = haxe.StackItem;
haxe.StackItem.Module = function(m) { var $x = ["Module",1,m]; $x.__enum__ = haxe.StackItem; return $x; };
haxe.StackItem.FilePos = function(s,file,line) { var $x = ["FilePos",2,s,file,line]; $x.__enum__ = haxe.StackItem; return $x; };
haxe.StackItem.Method = function(classname,method) { var $x = ["Method",3,classname,method]; $x.__enum__ = haxe.StackItem; return $x; };
haxe.StackItem.LocalFunction = function(v) { var $x = ["LocalFunction",4,v]; $x.__enum__ = haxe.StackItem; return $x; };
haxe.CallStack = function() { };
haxe.CallStack.callStack = function() {
	var oldValue = Error.prepareStackTrace;
	Error.prepareStackTrace = function(error,callsites) {
		var stack = [];
		var _g = 0;
		while(_g < callsites.length) {
			var site = callsites[_g];
			++_g;
			var method = null;
			var fullName = site.getFunctionName();
			if(fullName != null) {
				var idx = fullName.lastIndexOf(".");
				if(idx >= 0) {
					var className = HxOverrides.substr(fullName,0,idx);
					var methodName = HxOverrides.substr(fullName,idx + 1,null);
					method = haxe.StackItem.Method(className,methodName);
				}
			}
			stack.push(haxe.StackItem.FilePos(method,site.getFileName(),site.getLineNumber()));
		}
		return stack;
	};
	var a = haxe.CallStack.makeStack(new Error().stack);
	a.shift();
	Error.prepareStackTrace = oldValue;
	return a;
};
haxe.CallStack.toString = function(stack) {
	var b = new StringBuf();
	var _g = 0;
	while(_g < stack.length) {
		var s = stack[_g];
		++_g;
		b.b += "\nCalled from ";
		haxe.CallStack.itemToString(b,s);
	}
	return b.b;
};
haxe.CallStack.itemToString = function(b,s) {
	switch(s[1]) {
	case 0:
		b.b += "a C function";
		break;
	case 1:
		var m = s[2];
		b.b += "module ";
		if(m == null) b.b += "null"; else b.b += "" + m;
		break;
	case 2:
		var line = s[4];
		var file = s[3];
		var s1 = s[2];
		if(s1 != null) {
			haxe.CallStack.itemToString(b,s1);
			b.b += " (";
		}
		if(file == null) b.b += "null"; else b.b += "" + file;
		b.b += " line ";
		if(line == null) b.b += "null"; else b.b += "" + line;
		if(s1 != null) b.b += ")";
		break;
	case 3:
		var meth = s[3];
		var cname = s[2];
		if(cname == null) b.b += "null"; else b.b += "" + cname;
		b.b += ".";
		if(meth == null) b.b += "null"; else b.b += "" + meth;
		break;
	case 4:
		var n = s[2];
		b.b += "local function #";
		if(n == null) b.b += "null"; else b.b += "" + n;
		break;
	}
};
haxe.CallStack.makeStack = function(s) {
	if(typeof(s) == "string") {
		var stack = s.split("\n");
		var m = [];
		var _g = 0;
		while(_g < stack.length) {
			var line = stack[_g];
			++_g;
			m.push(haxe.StackItem.Module(line));
		}
		return m;
	} else return s;
};
haxe.ds = {};
haxe.ds.StringMap = function() {
	this.h = { };
};
haxe.ds.StringMap.__interfaces__ = [IMap];
haxe.ds.StringMap.prototype = {
	set: function(key,value) {
		this.h["$" + key] = value;
	}
	,get: function(key) {
		return this.h["$" + key];
	}
	,exists: function(key) {
		return this.h.hasOwnProperty("$" + key);
	}
	,keys: function() {
		var a = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) a.push(key.substr(1));
		}
		return HxOverrides.iter(a);
	}
};
var wordsaxe = {};
wordsaxe.Error = $hx_exports.wordsaxe.Error = function() { };
wordsaxe.Error.setCode = function(value) {
	wordsaxe.Error.code = value;
	return false;
};
wordsaxe.Error.getCode = function() {
	return wordsaxe.Error.code;
};
wordsaxe.Position = $hx_exports.wordsaxe.Position = function(x,y,dx,dy) {
	if(dy == null) dy = 0;
	if(dx == null) dx = 0;
	if(y == null) y = 0;
	if(x == null) x = 0;
	this.dy = 0;
	this.dx = 0;
	this.y = 0;
	this.x = 0;
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
};
wordsaxe.Position.move = function(self) {
	return new wordsaxe.Position(self.x + self.dx,self.y + self.dy,self.dx,self.dy);
};
wordsaxe.Position.toJSON = function(self) {
	if(self == null) return null;
	return { x : self.x, y : self.y, dx : self.dx, dy : self.dy};
};
wordsaxe.Position.fromJSON = function(o) {
	return new wordsaxe.Position(o.x,o.y,o.dx | 0,o.dy | 0);
};
wordsaxe.Position.dirName = function(d) {
	if(d > 0) return "+"; else if(d < 0) return "-"; else return "=";
};
wordsaxe.Position.dirFromName = function(dName) {
	if(dName == "+") return 1; else if(dName == "-") return -1; else return 0;
};
wordsaxe.Position.toName = function(self) {
	if(self == null) return null;
	var out = wordsaxe.Utils.LETTERS.charAt(self.y) + self.x;
	if(self.dx != 0 || self.dy != 0) return out + wordsaxe.Position.dirName(self.dx) + wordsaxe.Position.dirName(self.dy); else return out;
};
wordsaxe.Position.fromName = function(o) {
	if(o == null) return null;
	var equalIndex = o.indexOf("=");
	var plusIndex = o.indexOf("+");
	var minusIndex = o.indexOf("-");
	if(equalIndex > 0 || plusIndex > 0 || minusIndex > 0) return new wordsaxe.Position(Std.parseInt(HxOverrides.substr(o,1,o.length - 3)),HxOverrides.cca(o,0) - wordsaxe.Position.A_CODE,wordsaxe.Position.dirFromName(HxOverrides.substr(o,o.length - 2,1)),wordsaxe.Position.dirFromName(HxOverrides.substr(o,o.length - 1,1))); else return new wordsaxe.Position(Std.parseInt(HxOverrides.substr(o,1,null)),HxOverrides.cca(o,0) - wordsaxe.Position.A_CODE);
};
wordsaxe.Position.prototype = {
	clone: function() {
		return new wordsaxe.Position(this.x,this.y,this.dx,this.dy);
	}
};
wordsaxe.Utils = $hx_exports.wordsaxe.Utils = function() { };
wordsaxe.Utils.error = function(s1,s2) {
};
wordsaxe.Utils.emitError = function(code,message) {
	wordsaxe.Utils.error(code,message + "\n" + haxe.CallStack.toString(haxe.CallStack.callStack()));
};
wordsaxe.Player = $hx_exports.wordsaxe.Player = function(name,score) {
	if(score == null) score = 0;
	if(name == null) name = "";
	this.score = 0;
	this.name = "";
	this.name = name;
	this.score = score;
};
wordsaxe.Player.toJSON = function(self) {
	return { name : self.name, score : self.score};
};
wordsaxe.Player.fromJSON = function(o) {
	var self = new wordsaxe.Player();
	self.name = o.name;
	self.score = o.score | 0;
	return self;
};
wordsaxe.Player.prototype = {
	clone: function() {
		return wordsaxe.Player.fromJSON(wordsaxe.Player.toJSON(this));
	}
	,addToScore: function(nPoints) {
		return new wordsaxe.Player(this.name,this.score + nPoints);
	}
};
wordsaxe.WordTheme = $hx_exports.wordsaxe.WordTheme = function() {
	this.lang = "";
	this.id = "";
	this.words = new Array();
};
wordsaxe.WordTheme.fromJSON = function(o) {
	var self = new wordsaxe.WordTheme();
	self.words = o.words.concat([]);
	self.lang = o.lang;
	self.id = o.id;
	return self;
};
wordsaxe.WordTheme.toJSON = function(self) {
	return { words : self.words.concat([]), lang : self.lang, id : self.id};
};
wordsaxe.RoundEntry = $hx_exports.wordsaxe.RoundEntry = function() {
	this.timestamps = new Array();
	this.positions = new Array();
	this.playerName = "";
};
wordsaxe.RoundEntry.fromJSON = function(o) {
	if(o == null) return null;
	var ret = new wordsaxe.RoundEntry();
	ret.playerName = o.playerName;
	ret.positions = o.positions.map(wordsaxe.Position.fromName);
	ret.timestamps = o.timestamps.concat([]);
	if(ret.positions.length != ret.timestamps.length) wordsaxe.Utils.emitError("InvalidJSON","RoundEntry positions and timestamps array have different sizes");
	return ret;
};
wordsaxe.RoundEntry.toJSON = function(self) {
	if(self == null) return null;
	return { playerName : self.playerName, positions : self.positions.map(wordsaxe.Position.toName), timestamps : self.timestamps};
};
wordsaxe.RoundEntry.prototype = {
	clone: function() {
		return wordsaxe.RoundEntry.fromJSON(wordsaxe.RoundEntry.toJSON(this));
	}
	,add: function(position,timestamp) {
		var ret = new wordsaxe.RoundEntry();
		ret.playerName = this.playerName;
		ret.positions = this.positions.concat([position]);
		ret.timestamps = this.timestamps.concat([timestamp]);
		return ret;
	}
	,skip: function() {
		return this.add(null,99);
	}
};
wordsaxe.LettersGrid = $hx_exports.wordsaxe.LettersGrid = function() {
};
wordsaxe.LettersGrid.toJSON = function(self) {
	return { size : self.size, letters : self.letters};
};
wordsaxe.LettersGrid.fromJSON = function(o) {
	var ret = new wordsaxe.LettersGrid();
	ret.size = o.size;
	ret.letters = o.letters;
	return ret;
};
wordsaxe.LettersGrid.fromArray = function(size,array) {
	var ret = new wordsaxe.LettersGrid();
	ret.size = size;
	ret.letters = array.join("");
	return ret;
};
wordsaxe.LettersGrid.toString = function(self) {
	var out = "";
	var _g1 = 0;
	var _g = self.size;
	while(_g1 < _g) {
		var y = _g1++;
		out += HxOverrides.substr(self.letters,y * self.size,self.size) + "\n";
	}
	return out;
};
wordsaxe.LettersGrid.hasWordAt = function(self,word,pos) {
	return pos != null && wordsaxe.LettersGrid.hasWord(self,word,pos.x,pos.y,pos.dx,pos.dy);
};
wordsaxe.LettersGrid.hasWord = function(self,word,x,y,dx,dy) {
	if(word.length == 0) return true;
	if(self.letterAt(x,y) != word.charAt(0)) return false;
	return wordsaxe.LettersGrid.hasWord(self,HxOverrides.substr(word,1,null),x + dx,y + dy,dx,dy);
};
wordsaxe.LettersGrid.prototype = {
	letterAt: function(x,y) {
		if(x < 0 || y < 0 || x >= this.size || y >= this.size) return null;
		var index = y * this.size + x;
		return this.letters.charAt(index);
	}
};
wordsaxe.Fiche = $hx_exports.wordsaxe.Fiche = function(position,color) {
	if(color == null) color = 0;
	this.color = 0;
	this.position = new wordsaxe.Position();
	if(position != null) this.position = position; else this.position = new wordsaxe.Position();
	this.color = color;
};
wordsaxe.Fiche.fromName = function(o) {
	if(o == null) return null;
	var tokens = o.split(":");
	if(tokens.length != 2) return null;
	return new wordsaxe.Fiche(wordsaxe.Position.fromName(tokens[0]),Std.parseInt(tokens[1]));
};
wordsaxe.Fiche.toName = function(self) {
	if(self == null) return null;
	return wordsaxe.Position.toName(self.position) + ":" + self.color;
};
wordsaxe.Board = $hx_exports.wordsaxe.Board = function(lettersGrid,fiches) {
	if(lettersGrid != null) this.lettersGrid = lettersGrid; else this.lettersGrid = new wordsaxe.LettersGrid();
	if(fiches != null) this.fiches = fiches; else this.fiches = new Array();
};
wordsaxe.Board.toJSON = function(self) {
	return { lettersGrid : wordsaxe.LettersGrid.toJSON(self.lettersGrid), fiches : self.fiches.map(wordsaxe.Fiche.toName)};
};
wordsaxe.Board.fromJSON = function(o) {
	var ret = new wordsaxe.Board();
	ret.lettersGrid = wordsaxe.LettersGrid.fromJSON(o.lettersGrid);
	ret.fiches = o.fiches.map(wordsaxe.Fiche.fromName);
	return ret;
};
wordsaxe.Board.prototype = {
	clone: function() {
		return new wordsaxe.Board(this.lettersGrid,this.fiches);
	}
	,name: function() {
		return "";
	}
};
wordsaxe.Round = $hx_exports.wordsaxe.Round = function() {
	this.entries = new Array();
	this.board = new wordsaxe.Board();
	this.words = new Array();
};
wordsaxe.Round.fromJSON = function(o) {
	var self = new wordsaxe.Round();
	self.words = o.words.concat([]);
	self.board = wordsaxe.Board.fromJSON(o.board);
	self.entries = o.entries.map(wordsaxe.RoundEntry.fromJSON);
	return self;
};
wordsaxe.Round.toJSON = function(self) {
	return { board : wordsaxe.Board.toJSON(self.board), words : self.words, entries : self.entries.map(wordsaxe.RoundEntry.toJSON)};
};
wordsaxe.Round.prototype = {
	clone: function() {
		var ret = new wordsaxe.Round();
		ret.words = this.words;
		ret.board = this.board;
		ret.entries = this.entries;
		return ret;
	}
	,addEntry: function(entry) {
		var ret = this.clone();
		ret.entries = this.entries.concat([entry]);
		return ret;
	}
};
wordsaxe.State = $hx_exports.wordsaxe.State = function() {
	this.rounds = new Array();
	this.firstPlayerIndex = 0;
	this.players = [];
};
wordsaxe.State.fromJSON = function(o) {
	var self = new wordsaxe.State();
	self.players = o.players.map(wordsaxe.Player.fromJSON);
	self.firstPlayerIndex = o.firstPlayerIndex;
	self.rounds = o.rounds.map(wordsaxe.Round.fromJSON);
	return self;
};
wordsaxe.State.toJSON = function(self) {
	return { players : self.players.map(wordsaxe.Player.toJSON), firstPlayerIndex : self.firstPlayerIndex, rounds : self.rounds.map(wordsaxe.Round.toJSON)};
};
wordsaxe.State.prototype = {
	currentPlayerIndex: function() {
		var nEntries = 0;
		var _g1 = 0;
		var _g = this.rounds.length;
		while(_g1 < _g) {
			var index = _g1++;
			nEntries += this.rounds[index].entries.length;
		}
		var n = nEntries + 1 >> 1 % this.players.length;
		return (this.firstPlayerIndex + n) % this.players.length;
	}
	,currentRoundIndex: function() {
		var _g1 = 0;
		var _g = this.rounds.length;
		while(_g1 < _g) {
			var index = _g1++;
			if(this.rounds[index].entries.length < this.players.length) return index;
		}
		return -1;
	}
	,currentRound: function() {
		var index = this.currentRoundIndex();
		if(index < 0) return null; else return this.rounds[index];
	}
	,clone: function() {
		var ret = new wordsaxe.State();
		ret.players = this.players.concat([]);
		ret.firstPlayerIndex = this.firstPlayerIndex;
		ret.rounds = this.rounds.concat([]);
		return ret;
	}
	,player: function(name) {
		var _g1 = 0;
		var _g = this.players.length;
		while(_g1 < _g) {
			var i = _g1++;
			if(this.players[i].name == name) return this.players[i];
		}
		wordsaxe.Utils.emitError("InvalidPlayer","Cannot find player " + name);
		return this.players[0];
	}
	,currentPlayer: function() {
		var c = this.currentPlayerIndex();
		if(c >= 0 && c < this.players.length) return this.players[c]; else return null;
	}
	,currentPlayerName: function() {
		var p = this.currentPlayer();
		if(p != null) return p.name; else return "";
	}
	,addRoundEntry: function(entry) {
		var ret = this.clone();
		var currentRoundIndex = ret.currentRoundIndex();
		ret.rounds[currentRoundIndex] = ret.rounds[currentRoundIndex].addEntry(entry);
		return ret;
	}
};
wordsaxe.RandomGenerator = $hx_exports.wordsaxe.RandomGenerator = function(seed) {
	if(seed == null) seed = 0;
	if(seed > 0) this.mSeed = seed; else this.mSeed = wordsaxe.RandomGenerator.randomSeed();
};
wordsaxe.RandomGenerator.randomSeed = function() {
	return 1 + Math.floor(Math.random() * 2147483646);
};
wordsaxe.RandomGenerator.prototype = {
	clone: function() {
		return new wordsaxe.RandomGenerator(this.mSeed);
	}
	,nextInt: function() {
		var lo = 16807 * (this.mSeed & 65535);
		var hi = 16807 * (this.mSeed >>> 16);
		lo += (hi & 32767) << 16;
		lo += hi >>> 15;
		if(lo > 2147483647 || lo < 0) lo -= 2147483647;
		return this.mSeed = lo;
	}
	,nextFloat: function() {
		return this.nextInt() / 2147483647.;
	}
	,nextGenerator: function() {
		return new wordsaxe.RandomGenerator(this.nextInt());
	}
	,shuffle: function(arr) {
		if(arr != null) {
			arr = arr.concat([]);
			var _g1 = 0;
			var _g = arr.length;
			while(_g1 < _g) {
				var i = _g1++;
				var j = (this.nextInt() >> 8) % arr.length;
				var a = arr[i];
				var b = arr[j];
				arr[i] = b;
				arr[j] = a;
			}
		}
		return arr;
	}
	,pickN: function(n,list) {
		if(n > list.length) {
			wordsaxe.Utils.emitError("ListTooShort","Can't pick " + n + " elements in a list of " + list.length + " elements");
			return this.shuffle(list);
		}
		return this.shuffle(list).slice(0,n);
	}
};
wordsaxe.Rules = $hx_exports.wordsaxe.Rules = function() {
	this.mID = "RULES";
	this.mNumRoundsPerGame = wordsaxe.Rules.NUM_ROUNDS_PER_GAME_DEFAULT;
	this.mNumWordsPerRound = wordsaxe.Rules.NUM_WORDS_PER_ROUND_DEFAULT;
	this.mGridSize = wordsaxe.Rules.GRID_SIZE_DEFAULT;
	this.mWordDuration = wordsaxe.Rules.WORD_DURATION_DEFAULT;
};
wordsaxe.Rules.prototype = {
	numWordsPerRound: function(roundIndex) {
		return this.mNumWordsPerRound;
	}
	,newGame: function(seed,playerNames,wordTheme) {
		var s = new wordsaxe.State();
		var random = new wordsaxe.RandomGenerator(seed);
		s.players = playerNames.map(function(name) {
			return wordsaxe.Player.fromJSON({ name : name});
		});
		s.firstPlayerIndex = random.nextInt() % 2;
		var attempts = 0;
		do {
			s.rounds = this.generateRounds(random,wordTheme);
			attempts++;
		} while(s.rounds == null && attempts < 100);
		if(s.rounds == null) return null;
		return s;
	}
	,startRound: function(state) {
		return wordsaxe.RoundEntry.fromJSON({ playerName : state.currentPlayerName(), positions : [], timestamps : []});
	}
	,skipWord: function(state,entry) {
		var expectedWord = this.currentWord(state.currentRound(),entry);
		if(expectedWord == null) {
			wordsaxe.Utils.emitError("NoWords","Can't skip more words, entry is complete");
			return null;
		}
		return entry.skip();
	}
	,addWord: function(state,entry,timestamp,word,x,y,dx,dy) {
		if(timestamp > this.mWordDuration) {
			wordsaxe.Utils.emitError("WordTimeout","Can't add word: it's too late!");
			return null;
		}
		if(dx == 0 && dy == 0 || dx < -1 || dx > 1 || dy < -1 || dy > 1) {
			wordsaxe.Utils.emitError("InvalidDirection","The provided direction isn't valid");
			return null;
		}
		var gridSize = state.currentRound().board.lettersGrid.size;
		if(x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
			wordsaxe.Utils.emitError("InvalidPosition","The provided position falls outside the grid");
			return null;
		}
		if(!wordsaxe.LettersGrid.hasWord(state.currentRound().board.lettersGrid,word,x,y,dx,dy)) {
			wordsaxe.Utils.emitError("BadPosition","Can't add word '" + word + "' in at the given location.");
			return null;
		}
		var expectedWord = this.currentWord(state.currentRound(),entry);
		if(expectedWord == null) {
			wordsaxe.Utils.emitError("NoWords","Can't add more words, entry is complete");
			return null;
		}
		if(expectedWord != word) {
			wordsaxe.Utils.emitError("BadWord","The given word is not the expected one (" + word + " != " + expectedWord + ")");
			return null;
		}
		return entry.add(new wordsaxe.Position(x,y,dx,dy),timestamp);
	}
	,currentBoard: function(round,entry) {
		return new wordsaxe.Board(round.board.lettersGrid,this.getFiches(round,entry));
	}
	,getTimestamp: function(round,entryIndex,wordIndex) {
		if(entryIndex >= 0) return round.entries[entryIndex].timestamps[wordIndex]; else return this.mWordDuration + 1;
	}
	,getPosition: function(round,entryIndex,wordIndex) {
		if(entryIndex >= 0) return round.entries[entryIndex].positions[wordIndex]; else return null;
	}
	,getBestEntryIndex: function(round,wordIndex,entriesLength) {
		if(entriesLength == null) entriesLength = -1;
		if(entriesLength < 0) entriesLength = round.entries.length;
		var bestIndex = -1;
		var best = this.mWordDuration + 1;
		var _g = 0;
		while(_g < entriesLength) {
			var entryIndex = _g++;
			var timestamps = round.entries[entryIndex].timestamps;
			if(timestamps.length > wordIndex && best > timestamps[wordIndex]) {
				best = timestamps[wordIndex];
				bestIndex = entryIndex;
			}
		}
		return bestIndex;
	}
	,getFiches: function(round,entry) {
		var out = [];
		if(entry == null || entry.positions == null) return out;
		var lastEntryIndex = round.entries.length;
		var _g1 = 0;
		var _g = round.entries.length;
		while(_g1 < _g) {
			var i = _g1++;
			if(round.entries[i] == entry) lastEntryIndex = i;
		}
		var fichePositions = new haxe.ds.StringMap();
		var _g11 = 0;
		var _g2 = entry.positions.length;
		while(_g11 < _g2) {
			var index = _g11++;
			var color = 1;
			var word = round.words[index];
			var dirpos = entry.positions[index];
			var bestEntryIndex = this.getBestEntryIndex(round,index,lastEntryIndex);
			if(dirpos == null) {
				if(bestEntryIndex >= 0) {
					dirpos = this.getPosition(round,bestEntryIndex,index);
					color = 0;
				} else {
					dirpos = wordsaxe.Bot.findWord(round.board.lettersGrid,word);
					color = 2;
				}
			} else if(entry.timestamps[index] >= this.getTimestamp(round,bestEntryIndex,index)) {
				dirpos = this.getPosition(round,bestEntryIndex,index);
				color = 0;
			}
			var _g3 = 0;
			var _g21 = word.length;
			while(_g3 < _g21) {
				var i1 = _g3++;
				var pos = new wordsaxe.Position(dirpos.x,dirpos.y);
				var pName = wordsaxe.Position.toName(pos);
				var fiche = new wordsaxe.Fiche(pos,color);
				if(fichePositions.exists(pName)) {
					var eraseIndex = fichePositions.get(pName);
					out.splice(eraseIndex,1);
					var $it0 = fichePositions.keys();
					while( $it0.hasNext() ) {
						var fp = $it0.next();
						if(fichePositions.get(fp) > eraseIndex) {
							var value = fichePositions.get(fp) - 1;
							fichePositions.set(fp,value);
						}
					}
				}
				fichePositions.set(pName,out.length);
				out.push(fiche);
				dirpos = wordsaxe.Position.move(dirpos);
			}
		}
		return out;
	}
	,submitEntry: function(state,entry) {
		var newState = state.clone();
		if(entry.playerName != state.currentPlayerName()) {
			wordsaxe.Utils.emitError("BadEntryPlayer","It's not '" + entry.playerName + "' to play");
			return null;
		}
		if(state.currentRound() == null) {
			wordsaxe.Utils.emitError("GameOver","Can't add more entries, the game is over");
			return null;
		}
		if(state.currentRound().words.length != entry.positions.length) {
			wordsaxe.Utils.emitError("IncompleteEntry","Can't submit an incomplete round entry");
			return null;
		}
		var grid = state.currentRound().board.lettersGrid;
		var words = state.currentRound().words;
		var positions = entry.positions;
		var timestamps = entry.timestamps;
		var _g1 = 0;
		var _g = words.length;
		while(_g1 < _g) {
			var i = _g1++;
			var position = null;
			if(i < positions.length) {
				if(positions[i] != null) {
					if(timestamps[i] < 0) {
						wordsaxe.Utils.emitError("BadEntryTimestamp","A word in the submitted entry has a negative timestamp");
						return null;
					}
					if(timestamps[i] > this.mWordDuration) {
						wordsaxe.Utils.emitError("BadEntryTimestamp","A word in the submitted entry has a too large timestamp");
						return null;
					}
					if(!wordsaxe.LettersGrid.hasWordAt(grid,words[i],positions[i])) {
						wordsaxe.Utils.emitError("BadEntryWord","A position in the submitted entry is invalid");
						return null;
					}
				}
			}
		}
		var currentRoundIndex = newState.currentRoundIndex();
		newState = newState.addRoundEntry(entry);
		newState.players = this.stateScores(newState);
		return newState;
	}
	,generateRounds: function(random,wordTheme) {
		var _g = this;
		var rounds = new Array();
		var totalWords = 0;
		var _g1 = 0;
		var _g2 = this.mNumRoundsPerGame;
		while(_g1 < _g2) {
			var i = _g1++;
			totalWords += this.numWordsPerRound(i);
		}
		var dictionary = random.pickN(totalWords,wordTheme.words.filter(function(word) {
			return word.length < _g.mGridSize;
		}));
		var dictionaryIndex = 0;
		var _g11 = 0;
		var _g3 = this.mNumRoundsPerGame;
		while(_g11 < _g3) {
			var i1 = _g11++;
			var r = new wordsaxe.Round();
			var attempts = 0;
			r.words = dictionary.slice(dictionaryIndex,dictionaryIndex + this.numWordsPerRound(i1));
			do {
				r.board = wordsaxe.BoardGenerator.generate(this.mGridSize,r.words,random.nextGenerator());
				++attempts;
			} while(r.board == null && attempts < 100);
			if(r.board == null) return null;
			dictionaryIndex += this.numWordsPerRound(i1);
			rounds.push(r);
		}
		return rounds;
	}
	,currentPlayer: function(state) {
		if(this.isGameOver(state)) return "";
		return state.players[state.currentPlayerIndex()].name;
	}
	,isGameOver: function(state) {
		return state.players.length == 0 || state.currentRound() == null;
	}
	,scores: function(state) {
		var scores = { };
		var _g1 = 0;
		var _g = state.players.length;
		while(_g1 < _g) {
			var i = _g1++;
			Reflect.setProperty(scores,state.players[i].name,state.players[i].score);
		}
		return scores;
	}
	,currentWord: function(round,entry) {
		var index = entry.positions.length;
		if(index < round.words.length) return round.words[index]; else return null;
	}
	,asBefore: function(state,roundIndex,entryIndex) {
		var ret = new wordsaxe.State();
		ret.rounds = state.rounds.map(function(round) {
			var ret1 = round.clone();
			ret1.entries = [];
			return ret1;
		});
		ret.players = state.players.map(function(player) {
			return player.addToScore(-player.score);
		});
		ret.firstPlayerIndex = state.firstPlayerIndex;
		var _g1 = 0;
		var _g = state.rounds.length;
		while(_g1 < _g) {
			var r = _g1++;
			var _g3 = 0;
			var _g2 = state.rounds[r].entries.length;
			while(_g3 < _g2) {
				var e = _g3++;
				if(r < roundIndex || r == roundIndex && e < entryIndex) ret = this.submitEntry(ret,state.rounds[r].entries[e]);
			}
		}
		return ret;
	}
	,zeroScores: function(state) {
		return state.players.map(function(p) {
			return new wordsaxe.Player(p.name,0);
		});
	}
	,stateScores: function(state) {
		var total = this.zeroScores(state);
		var _g1 = 0;
		var _g = state.rounds.length;
		while(_g1 < _g) {
			var roundIndex = _g1++;
			var scores = this.roundScores(state,roundIndex);
			var _g3 = 0;
			var _g2 = total.length;
			while(_g3 < _g2) {
				var index = _g3++;
				total[index].score += scores[index].score;
			}
		}
		return total;
	}
	,roundScores: function(state,roundIndex) {
		var round = state.rounds[roundIndex];
		if(round.entries.length == 0) return this.zeroScores(state); else {
			var round1 = state.rounds[roundIndex];
			return this.entryScores(state,roundIndex,round1.entries.length - 1);
		}
	}
	,entryScores: function(state,roundIndex,entryIndex) {
		var round = state.rounds[roundIndex];
		var entry = round.entries[entryIndex];
		var scores = [0,0,0];
		var fiches = this.getFiches(round,entry);
		var _g1 = 0;
		var _g = fiches.length;
		while(_g1 < _g) {
			var i = _g1++;
			scores[fiches[i].color] += 5;
		}
		var score0;
		var score1;
		if(entryIndex == 0) {
			score0 = scores[1];
			score1 = scores[0];
		} else {
			score0 = scores[0];
			score1 = scores[1];
		}
		if(state.players.length == 1) return [wordsaxe.Player.fromJSON({ name : state.players[0].name, score : score0})]; else return [wordsaxe.Player.fromJSON({ name : state.players[0].name, score : score0}),wordsaxe.Player.fromJSON({ name : state.players[1].name, score : score1})];
	}
};
wordsaxe.MutableGrid = $hx_exports.wordsaxe.MutableGrid = function(size,letters) {
	this.size = size;
	this.letters = letters;
	if(letters == null) this.reset();
};
wordsaxe.MutableGrid.prototype = {
	reset: function() {
		this.letters = new Array();
		var _g1 = 0;
		var _g = this.size * this.size;
		while(_g1 < _g) {
			var i = _g1++;
			this.letters.push(" ");
		}
	}
	,clone: function() {
		return new wordsaxe.MutableGrid(this.size,this.letters);
	}
	,toLettersGrid: function() {
		return wordsaxe.LettersGrid.fromArray(this.size,this.letters);
	}
};
wordsaxe.BoardGenerator = $hx_exports.wordsaxe.BoardGenerator = function() { };
wordsaxe.BoardGenerator.generate = function(gridSize,words,random) {
	var board = new wordsaxe.Board();
	var grid = new wordsaxe.MutableGrid(gridSize);
	var _g1 = 0;
	var _g = words.length;
	while(_g1 < _g) {
		var i = _g1++;
		var options = random.shuffle(wordsaxe.BoardGenerator.bestPositions(words[i],grid));
		if(options.length == 0) return null;
		grid = wordsaxe.BoardGenerator.mark(words[i],grid,options[0]);
	}
	var _g11 = 0;
	var _g2 = grid.size * grid.size;
	while(_g11 < _g2) {
		var i1 = _g11++;
		if(grid.letters[i1] == " ") grid.letters[i1] = wordsaxe.Utils.LETTERS.charAt(random.nextInt() % wordsaxe.Utils.LETTERS.length);
	}
	board.lettersGrid = grid.toLettersGrid();
	return board;
};
wordsaxe.BoardGenerator.canAddWord = function(word,grid,x,y,dx,dy) {
	var finalX = x + dx * (word.length - 1);
	var finalY = y + dy * (word.length - 1);
	if(finalX < 0 || finalY < 0 || finalX >= grid.size || finalY >= grid.size) return false;
	var dindex = dy * grid.size + dx;
	var index = y * grid.size + x;
	var _g1 = 0;
	var _g = word.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(grid.letters[index] != " " && grid.letters[index] != word.charAt(i)) return false;
		index += dindex;
	}
	return true;
};
wordsaxe.BoardGenerator.mark = function(word,grid0,position) {
	var grid = grid0.clone();
	var index = position.y * grid.size + position.x;
	var dindex = position.dy * grid.size + position.dx;
	var _g1 = 0;
	var _g = word.length;
	while(_g1 < _g) {
		var i = _g1++;
		grid.letters[index] = word.charAt(i);
		index += dindex;
	}
	return grid;
};
wordsaxe.BoardGenerator.numCrosses = function(word,grid,x,y,dx,dy) {
	var n = 0;
	var index = y * grid.size + x;
	var dindex = dy * grid.size + dx;
	var _g1 = 0;
	var _g = word.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(grid.letters[index] != " ") ++n;
		index += dindex;
	}
	return n;
};
wordsaxe.BoardGenerator.bestPositions = function(word,grid) {
	var bestCross = 0;
	var out = [];
	var _g1 = 0;
	var _g = grid.size;
	while(_g1 < _g) {
		var x = _g1++;
		var _g3 = 0;
		var _g2 = grid.size;
		while(_g3 < _g2) {
			var y = _g3++;
			var _g5 = 0;
			var _g4 = wordsaxe.Utils.DIRECTIONS.length;
			while(_g5 < _g4) {
				var d = _g5++;
				var dx = wordsaxe.Utils.DIRECTIONS[d].dx;
				var dy = wordsaxe.Utils.DIRECTIONS[d].dy;
				if(wordsaxe.BoardGenerator.canAddWord(word,grid,x,y,dx,dy)) {
					var n = wordsaxe.BoardGenerator.numCrosses(word,grid,x,y,dx,dy);
					if(n == bestCross) out.push(new wordsaxe.Position(x,y,dx,dy)); else if(n > bestCross) {
						out = [new wordsaxe.Position(x,y,dx,dy)];
						bestCross = n;
					}
				}
			}
		}
	}
	return out;
};
wordsaxe.Bot = $hx_exports.wordsaxe.Bot = function() { };
wordsaxe.Bot.findWordInDirection = function(grid,word,x,y,dx,dy) {
	if(word.length == 0) return new wordsaxe.Position(x,y,dx,dy);
	if(grid.letterAt(x,y) != word.charAt(0)) return null;
	if(wordsaxe.Bot.findWordInDirection(grid,HxOverrides.substr(word,1,null),x + dx,y + dy,dx,dy) != null) return new wordsaxe.Position(x,y,dx,dy); else return null;
};
wordsaxe.Bot.findWordAt = function(grid,word,x,y) {
	var p;
	p = wordsaxe.Bot.findWordInDirection(grid,word,x,y,1,0);
	if(p != null) return p;
	p = wordsaxe.Bot.findWordInDirection(grid,word,x,y,1,1);
	if(p != null) return p;
	p = wordsaxe.Bot.findWordInDirection(grid,word,x,y,0,1);
	if(p != null) return p;
	p = wordsaxe.Bot.findWordInDirection(grid,word,x,y,-1,1);
	if(p != null) return p;
	p = wordsaxe.Bot.findWordInDirection(grid,word,x,y,-1,0);
	if(p != null) return p;
	p = wordsaxe.Bot.findWordInDirection(grid,word,x,y,-1,-1);
	if(p != null) return p;
	p = wordsaxe.Bot.findWordInDirection(grid,word,x,y,0,-1);
	if(p != null) return p;
	p = wordsaxe.Bot.findWordInDirection(grid,word,x,y,1,-1);
	return p;
};
wordsaxe.Bot.findWord = function(grid,word) {
	var _g1 = 0;
	var _g = grid.size;
	while(_g1 < _g) {
		var x = _g1++;
		var _g3 = 0;
		var _g2 = grid.size;
		while(_g3 < _g2) {
			var y = _g3++;
			var pos = wordsaxe.Bot.findWordAt(grid,word,x,y);
			if(pos != null) return pos;
		}
	}
	return null;
};
Math.NaN = Number.NaN;
Math.NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;
Math.POSITIVE_INFINITY = Number.POSITIVE_INFINITY;
Math.isFinite = function(i) {
	return isFinite(i);
};
Math.isNaN = function(i1) {
	return isNaN(i1);
};
if(Array.prototype.map == null) Array.prototype.map = function(f) {
	var a = [];
	var _g1 = 0;
	var _g = this.length;
	while(_g1 < _g) {
		var i = _g1++;
		a[i] = f(this[i]);
	}
	return a;
};
if(Array.prototype.filter == null) Array.prototype.filter = function(f1) {
	var a1 = [];
	var _g11 = 0;
	var _g2 = this.length;
	while(_g11 < _g2) {
		var i1 = _g11++;
		var e = this[i1];
		if(f1(e)) a1.push(e);
	}
	return a1;
};
wordsaxe.Error.GAME_IS_OVER = "GAME_IS_OVER";
wordsaxe.Error.code = "";
wordsaxe.Position.A_CODE = HxOverrides.cca("A",0);
wordsaxe.Utils.LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
wordsaxe.Utils.DIRECTIONS = [new wordsaxe.Position(0,0,-1,1),new wordsaxe.Position(0,0,0,1),new wordsaxe.Position(0,0,1,1),new wordsaxe.Position(0,0,1,0),new wordsaxe.Position(0,0,-1,0),new wordsaxe.Position(0,0,-1,-1),new wordsaxe.Position(0,0,0,-1),new wordsaxe.Position(0,0,1,-1)];
wordsaxe.RandomGenerator.RAND_MAX = 2147483647.;
wordsaxe.RandomGenerator.INT32_MAX = 2147483647;
wordsaxe.Rules.NUM_ROUNDS_PER_GAME_DEFAULT = 5;
wordsaxe.Rules.NUM_WORDS_PER_ROUND_DEFAULT = 8;
wordsaxe.Rules.GRID_SIZE_DEFAULT = 7;
wordsaxe.Rules.WORD_DURATION_DEFAULT = 5;
wordsaxe.Rules.RANDOM_GAME = 0;
wordsaxe.Rules.OPPONENT_COLOR = 0;
wordsaxe.Rules.PLAYER_COLOR = 1;
wordsaxe.Rules.BOT_COLOR = 2;
})(typeof window != "undefined" ? window : exports);
