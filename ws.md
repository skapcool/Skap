## Note: 
Skap uses msgpack to encode and decode ws messages. In this document, I will assume you are using [The msgpack version skap and SkapClient are using](https://nky5223.github.io/SkapClient/js/msgpack.min.js).


## Using msgpack
msgpack has two useful functions:

```ts
msgpack.encode(data: unknown): Uint8Array
msgpack.decode(data: Uint8Array): unknown
```

> You will need to set the `WebSocket`'s `binaryType` to `"arraybuffer"`, and pass the clientbound messages through `new Uint8Array`.

Example code:
```js
const ws = new WebSocket("wss://skap.io");
ws.binaryType = "arraybuffer";
ws.addEventListener("message", e => {
	const msg = msgpack.decode(new Uint8Array(e.data));

	// Process msg
});
const send = msg => {
	ws.send(msgpack.encode(msg));
}
```

## Skap message format
Skap messages are objects with an `e` property as a message type. The below will attempt to list them all.

```ts
// Some useful type definitions:
type RGB = [number, number, number]; // where elements ∈ [0, 255].
type RGBA = [number, number, number, number]; // where elements 0-2 ∈ [0, 255] and elment 3 ∈ [0, 1].

type Vec2 = { x: number, y: number };
```

| [Account system](#account-system) | [Changing room](#changing-room) | [Games](#games) |
| :-: | :-: | :-: |
| [**Gameplay**](#gameplay) |  |

### Account system
```ts
>>> { // A Serverbound message, sent by the client.
	e: "login",
	m: {
		username: string,
		password: string // SHA256(username + password).
	},
	t: string // Recaptcha token
}
```
```ts
>>> {
	e: "guest",
	t: string // Recaptcha token
}
```
```ts
>>> {
	e: "register",
	m: {
		username: string,
		password: string // SHA256(username + password).
	},
}
```
```ts
<<< { // Clientbound message, sent by the server.
	e: "result", // This is sent after login/register/guest.
	m: 0 | 1, // 0 = succeed, 1 = fail
	t: string, // Message to display, e.g. "Logged in as XXX".
	cookie: string // Session cookie, see below.
}
```
```ts
>>> {
	e: "session", // Send session cookie to server.
	cookie: string // Session cookie
}
```
```ts
>>> { // SERVERBOUND
	e: "logout" // Logout.
}
```
```ts
<<< { // CLIENTBOUND
	e: "logout" // Successfully logged out.
}
```

### Changing room
```ts
>>> {
	e: "getStyle" // Get the current color and hats.
}
```
```ts
<<< {
	e: "style", // Current color and hats.
	c: RGB, // Current color.
	s: string, // Current hat.
	h: string[] // All obtained hats.
}
```
```ts
>>> {
	e: "colorChange" // Change color.
	c: RGB // Color to change to.
}
```
```ts
>>> {
	e: "hatChange" // Change hat. Will trigger an { e: "style" } from the server.
	c: string // Hat to change to.
}
```

### Games
```ts
>>> {
	e: "games" // Get game list. Cannot be sent while in game.
}
```
```ts
<<< {
	e: "games", // Game list.
	g: {
		id: string, // The game id; See join.
		name: string, // Name of the game.
		private: string | null, // Password of the game or null if it is not private.
		players: number, // Number of current players.
		capacity: number, // Maximum number of players (1 for speedrun games).
		mapName: string, // Name of the map
		creator: string, // Creator of the map
	}[] // Array of games
}
```
```ts
>>> {
	e: "join", // Join game.
	g: string, // Game id; See games.
	p?: string // Game password
}
```
```ts
<<< {
	e: "join", // Joined game.
	m: 0, // dont know what this does, probably 1 if fail
	i: { // Initial game data
		map: SkapMap, // See initMap
		powers: number[], // A list of available powers
		states: SkapState // See updateStates
	}
}
```
```ts
>>> {
	e: "leave", // Leave game.
}
```
```ts
<<< {
	e: "leave", // Left game. (Kicked/Banned counts)
}
```

### Gameplay
```ts
<<< {
	e: "updateStates", // Update state.
	m: SkapState // See definition below.
}
type SkapState = {
	entities: SkapEntity[], // A list of entities.
	infos: { // Player info
		id: string, // Player's id.
		fuel: number, // Player's fuel (max 10). 
		oneCooldown: number, // Cooldown of first slot (max 1).
		oneHeat: number, // Heat (blue) of first slot (max 1).
		twoCooldown: number,
		twoHeat: number
	},
	particles: SkapParticle[], // List of particles to add.
	playerList: [string, string, boolean, boolean], // Name, Area Name, dead, frozen.
	players: {
		[id: string]: { // Player id.
			name: string,
			pos: Vec2, // Player position.
			vel: Vec2, // Player velocity.
			radius: number,
			hat: string,
			fuel: number, // Player fuel (should be hidden!).
			states: string[], // States include "Died", "Freeze" and "Feather".
			gravDir: number, // Gravity direction.
		}
	}
}
type SkapEntity = {
	type: string,
	pos: Vec2,
	radius: number,
	opacity: number,
	/* ...Other properties for entities. */
}
```
```ts
<<< {
	e: "initMap", // Initialise map.
	m: SkapMap // See definition below.
}
type SkapMap = {
	areaSize: Vec2,
	areaColor: RGB, // This is the white in overworld.
	backgroundColor: RGBA, // This is the blue, blended over a background image.
	objects: SkapObject[],
}
type SkapObject = {
	type: string, // Object type.
	id: number, // Object id; see updateMap.
	// There are way too many objects, figure it out yourself.
}
```
```ts
<<< {
	e: "updateMap", // Update map.
	m: {
		add: { // Add objects.
			type: string,
			id: number,
			// bla bla bla other stuff.
		}[],
		update: { // Update objects.
			type: string,
			id: number,
			...stuff: unknown // Properties to change.
		}[],
		remove: { // Remove objects.
			type: string,
			id: number
		}[]
	}
}
```
```ts
>>> { // finally some serverbound stuff god i hate skap ws
	e: "input", // Game inputs.
	input: {
		keys: number, // Key id:
		// 0 = up, 1 = left, etc. down, right, shift, sprint, power1, power2, powercombo, respawn
		value: boolean, // true = pressing, false = not pressing
	}
}
```
```ts
>>> {
	e: "aim", // Mouse aim.
	m: [number, number], // Aim relative to the game. Do math to convert between screen and skap units.
}
```
```ts
>>> {
	e: "powerChange", // Change power.
	i: number, // Power id.
	m: number, // Slot.
}
```
```ts
>>> { // SERVERBOUND
	e: "message", // Chat message.
	message: string, // Message contents.
}
```
```ts
<<< { // CLIENTBOUND
	e: "message", // Chat message.
	m: {
		i: string, // Message id.
		s: string, // Message author.
		r: number, // Author "level" (-2 = discord, -1 = guest, 0 = user, 1 = mod)
		m: string, // Message contents.
	}
}
```
```ts
<<< {
	e: "reward", // Power reward. Show the reward screen.
	m: number // Power id.
}
```
```ts
<<< {
	e: "power", // Powers. Add to available powers.
	m: number[] // List of power ids.
}
```
```ts
<<< {
	e: "reward", // Hat reward. Show the hat reward screen.
	m: string // Hat.
}
```