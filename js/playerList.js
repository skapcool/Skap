import Game from "./Game.js";

/** @typedef {Game["state"]["playerList"]} PlayerList */
/** @typedef {PlayerList[0]} PlayerListItem */

/** @type {PlayerList} */
const testData = [
	[
		"jayton67",
		"Exodus 15",
		true,
		false
	],
	[
		"juanlopez",
		"Exodus 28",
		true,
		false
	],
	[
		"brian0",
		"Exodus 11",
		true,
		false
	],
	[
		"crazy4corina",
		"Home",
		false,
		false
	],
	[
		"iforgotguy",
		"Exodus 28",
		true,
		false
	],
	[
		"COOLIO",
		"Exodus 15",
		false,
		false
	],
	[
		"tokeibR38nceUTv",
		"Home",
		false,
		false
	],
	[
		"Typemasterfrfr",
		"Exodus 8",
		false,
		false
	],
	[
		"zayzayEBSHOT",
		"Swamp 1",
		false,
		false
	],
	[
		"Guest516",
		"April fools 1",
		true,
		false
	],
	[
		"Guest081",
		"Room 6",
		false,
		false
	],
	[
		"bonsoirmuffin26",
		"Exodus 15",
		false,
		false
	],
	[
		"sushi",
		"Space 14",
		true,
		false
	],
	[
		"deblts",
		"Home",
		false,
		false
	],
	[
		"Kebab",
		"Space 14",
		true,
		false
	],
	[
		"Holytrinity2",
		"Tunnel 3",
		true,
		false
	],
	[
		"TotallyNotNKY",
		"Exodus 18",
		true,
		false
	],
	[
		"Tsunami",
		"Space Advanced 7",
		false,
		false
	],
	[
		"muffin",
		"Space 11",
		false,
		false
	],
	[
		"adam",
		"Inferno 2",
		false,
		false
	],
	[
		"capybara12345",
		"Occult 10",
		false,
		false
	],
	[
		"forsaken24",
		"Exodus 15",
		true,
		false
	],
	[
		"YaBoyButler5",
		"Exodus 15",
		false,
		false
	],
	[
		"ilovechinks",
		"Tunnel 3",
		false,
		false
	],
	[
		"MrSmall",
		"The Lava Lakes",
		false,
		false
	],
	[
		"Guest998",
		"Home",
		false,
		false
	],
	[
		"solar",
		"Space Advanced 7",
		true,
		false
	],
	[
		"Guest785",
		"Minefield 1",
		false,
		false
	],
	[
		"quincy222",
		"Home",
		false,
		false
	],
	[
		"CapybaraFather",
		"Home",
		false,
		false
	],
	[
		"fred",
		"Minefield 3",
		true,
		false
	],
	[
		"Yes",
		"Exodus 1",
		false,
		false
	],
	[
		"Kingpirates",
		"Minefield 1",
		false,
		false
	],
	[
		"fakeplayr",
		"Exodus 150 VICTORY",
		false,
		false
	],
	[
		"fakeplayr",
		"Exodus 150 FINALE",
		false,
		false
	]
]

/** @typedef {{ regex: RegExp, other: string[], areas: string[] }} AreaMatcher */
/** 
 * All regexes within this object should have `area`, `number` and `other` capturing groups. 
 * If `other` is present, it will be ranked based on `.other`
 * 
 * @satisfies {Record<string, AreaMatcher>}
 */
export const areaMatcher = {
	/** For overworld area names */
	overworld: {
		regex: /^(?<area>\D+)(?:\s+(?<number>\d+))?(?:\s+(?<other>\S+))?$/,
		other: [
			/** VICTORY will be before BOSS and FINALE */
			"VICTORY",
			"BOSS",
			"FINALE",
		],
		areas: [
			/** Exodus will be first */
			"Exodus",
			"April fools",
			"Nightmare",
		]
	}
};

const getNumber = str => Number([...str.matchAll(/\d/g)].map(([m]) => m).join(""));
const negOneToInf = num => num === -1 ? Infinity : num;
const sortWithArray = (a, b, arr) => {
	const ai = negOneToInf(arr.indexOf(a));
	const bi = negOneToInf(arr.indexOf(b));
	if (ai === bi) return a < b ? -1 : a > b ? 1 : 0;
	return ai - bi;
}

/**
 * @param {PlayerList} playerList 
 * @param {AreaMatcher} matcher
 * @returns {[string, PlayerList][]} `[area, playerList][]`
 * 
 * @example 
 * 
 * sortAreas([
 * 	["Player0", "Exodus 150 VICTORY", false, false], 
 * 	["Player1", "Exodus 10", true, false],
 * 	["Player2", "Exodus 50 VICTORY", false, false],
 * 	["Player3", "Exodus 50 BOSS", true, false],
 * 	["Player4", "Battlefield Advanced 10", false, false],
 * 	["Player5", "Battlefield 10", false, false],
 * ], areaMatcher.overworld);
 * returns ([
 * 	["Exodus", [
 * 		["Player1", "Exodus 10", true, false],
 * 		]["Player3", "Exodus 50 BOSS", true, false],
 * 		["Player2", "Exodus 50 VICTORY", false, false], // sorted with proper "<other>" handling
 * 		["Player0", "Exodus 150 VICTORY", false, false], // sorted from start to end
 * 	],
 * 	["Battlefield", [
 * 		["Player5", "Battlefield 10", false, false],
 * 	]],
 * 	["Battlefield Advanced", [
 * 		["Player4", "Battlefield Advanced 10", false, false],
 * 	]],
 * ])
 */
export function sortAreas(playerList, matcher) {
	const matched = playerList.map(player => {
		const playerArea = player[1];
		const matches = matcher.regex.exec(playerArea);
		if (!matches) {
			return {
				player,
				matches: {
					area: "???",
					number: getNumber(playerArea),
					other: "",
				}
			}
		}
		if (!matches.groups) throw new TypeError("Expected matcher regex to have capturing groups area, number and other")
		const { area, number, other } = matches.groups;
		return {
			player,
			matches: {
				area,
				number: !number ? -Infinity : Number(number),
				other: other ?? ""
			},
		}
	});

	/** @type {[string, (typeof matched)[0][]][]} */
	const grouped = [];
	matched.forEach(player => {
		const area = player.matches.area;
		const group = grouped.find(group => group[0] === area);

		if (!group) {
			grouped.push([area, [player]]);
			return;
		}
		group[1].push(player);
	})
	for (const [area, players] of grouped) {
		players.sort(({ matches: a }, { matches: b }) =>
			a.number === b.number ? sortWithArray(a.other, b.other, matcher.other) : b.number - a.number
		);
	}

	/** @type {[string, [string, string, boolean, boolean][]][]} */
	const final = grouped.map(([area, players]) => [area, players.map(player => player.player)]);
	final.sort(([a], [b]) => sortWithArray(a, b, matcher.areas));

	return final;
}