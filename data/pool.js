/*
 * Supplemental 2026 draft pool.
 *
 * The original board contains the projection-heavy core. This file fills in
 * current-market names outside that core and every team K/DEF so mock drafts
 * have a complete fantasy-relevant pool through the final rounds.
 */
(() => {
  const board = window.FANTASY_BOARD;
  const players = board.players;
  const byId = new Set(players.map((p) => p.id));
  const byName = new Set(players.map((p) => normalizeName(p.name)));
  const byeWeeks = { ARI: 14, ATL: 11, BAL: 13, BUF: 7, CAR: 5, CHI: 10, CIN: 6, CLE: 11, DAL: 14, DEN: 10, DET: 6, GB: 11, HOU: 8, IND: 13, JAX: 7, KC: 5, LAC: 7, LAR: 11, LV: 13, MIA: 6, MIN: 6, NE: 11, NO: 8, NYG: 8, NYJ: 13, PHI: 10, PIT: 9, SF: 8, SEA: 11, TB: 10, TEN: 9, WAS: 7 };
  let nextRank = Math.max(...players.map((p) => p.rank)) + 1;

  function normalizeName(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function fallbackProjection(pos, adp) {
    if (pos === "QB") return Math.max(9.5, 21.5 - adp * 0.045);
    if (pos === "TE") return Math.max(5.2, 17.5 - adp * 0.045);
    if (pos === "K" || pos === "DEF") return Math.max(4.2, 8.1 - adp * 0.006);
    return Math.max(5.3, 20.5 - adp * 0.055);
  }

  function add({ id, name, pos, team, adp, proj, tier = "Deep pool", status = "healthy", injury = "", depthRole = "ROTATION" }) {
    if (byId.has(id) || byName.has(normalizeName(name))) return;
    players.push({ id, name, pos, team, bye: byeWeeks[team] || 0, rank: nextRank++, adp, proj: proj ?? fallbackProjection(pos, adp), tier, fpg25: null, fpg24: null, status, injury, depthRole });
    byId.add(id);
    byName.add(normalizeName(name));
  }

  const marketExtras = [
    ["travis-kelce", "Travis Kelce", "TE", "KC", 90.6, "TE1"],
    ["alec-pierce", "Alec Pierce", "WR", "IND", 99.0, "WR2 / BIG PLAY"],
    ["quentin-johnston", "Quentin Johnston", "WR", "LAC", 113.8, "WR2 / RED ZONE"],
    ["jacory-croskey-merritt", "Jacory Croskey-Merritt", "RB", "WAS", 115.7, "RB2 / ROTATION"],
    ["kc-concepcion", "KC Concepcion", "WR", "CLE", 121.0, "WR2 / ROTATION"],
    ["matthew-golden", "Matthew Golden", "WR", "GB", 127.7, "WR2 / ROTATION"],
    ["oronde-gadsden", "Oronde Gadsden", "TE", "LAC", 131.5, "TE1 / ROTATION"],
    ["romeo-doubs", "Romeo Doubs", "WR", "NE", 133.1, "WR2 / ROTATION"],
    ["jared-goff", "Jared Goff", "QB", "DET", 134.9, "STARTER QB"],
    ["de-zhaun-stribling", "De'Zhaun Stribling", "WR", "SF", 138.8, "WR2 / ROTATION"],
    ["jalen-coker", "Jalen Coker", "WR", "CAR", 146.8, "WR2 / ROTATION"],
    ["jordan-love", "Jordan Love", "QB", "GB", 149.9, "STARTER QB"],
    ["mike-washington", "Mike Washington", "RB", "LV", 155.6, "ROTATION"],
    ["jakobi-lane", "Ja'Kobi Lane", "WR", "BAL", 156.1, "WR2 / ROTATION"],
    ["alvin-kamara", "Alvin Kamara", "RB", "NO", 161.1, "LEAD RB / INJURY RISK"],
    ["tj-hockenson", "T.J. Hockenson", "TE", "MIN", 163.5, "TE1 / INJURY RISK"],
    ["kenyon-sadiq", "Kenyon Sadiq", "TE", "NYJ", 164.4, "TE1 / ROTATION"],
    ["travis-hunter", "Travis Hunter", "WR", "JAX", 166.3, "WR1 / ROTATION"],
    ["denzel-boston", "Denzel Boston", "WR", "CLE", 169.3, "WR2 / ROTATION"],
    ["jonah-coleman", "Jonah Coleman", "RB", "DEN", 170.7, "RB2 / ROTATION"],
    ["cyrus-allen", "Cyrus Allen", "WR", "KC", 174.2, "ROTATION"],
    ["malik-washington", "Malik Washington", "WR", "MIA", 175.1, "WR2 / SLOT"],
    ["tank-dell", "Tank Dell", "WR", "HOU", 180.5, "WR2 / INJURY RISK"],
    ["fernando-mendoza", "Fernando Mendoza", "QB", "LV", 182.8, "STARTER QB"],
    ["jake-barner", "AJ Barner", "TE", "SEA", 183.5, "TE1 / ROTATION"],
    ["isiah-pacheco", "Isiah Pacheco", "RB", "DET", 186.8, "RB2 / ROTATION", "Q", "Questionable; current depth chart lists him behind Jahmyr Gibbs"],
    ["juwan-johnson", "Juwan Johnson", "TE", "NO", 187.7, "TE1 / ROTATION"],
    ["jerry-jeudy", "Jerry Jeudy", "WR", "CLE", 189.0, "WR1"],
    ["dalton-schultz", "Dalton Schultz", "TE", "HOU", 191.5, "TE1 / ROTATION"],
    ["chig-okonkwo", "Chig Okonkwo", "TE", "WAS", 191.5, "TE1 / ROTATION"],
    ["omar-cooper", "Omar Cooper", "WR", "NYJ", 194.7, "ROTATION"],
    ["malik-willis", "Malik Willis", "QB", "MIA", 195.1, "STARTER QB"],
    ["jayden-higgins", "Jayden Higgins", "WR", "HOU", 196.3, "WR2 / ROTATION"],
    ["caleb-douglas", "Caleb Douglas", "WR", "MIA", 198.4, "ROTATION"],
    ["cooper-kupp", "Cooper Kupp", "WR", "SEA", 199.6, "WR1 / INJURY RISK"],
    ["david-njoku", "David Njoku", "TE", "LAC", 207.0, "TE1"],
    ["zachariah-branch", "Zachariah Branch", "WR", "ATL", 207.6, "ROTATION"],
    ["emmett-johnson", "Emmett Johnson", "RB", "KC", 209.4, "HANDCUFF"],
    ["nicholas-singleton", "Nicholas Singleton", "RB", "TEN", 210.5, "RB2 / ROTATION"],
    ["tre-smack", "Trey Smack", "K", "GB", 213.6, "STARTER K"],
    ["jaylin-noel", "Jaylin Noel", "WR", "HOU", 213.7, "ROTATION"],
    ["kaelon-black", "Kaelon Black", "RB", "SF", 214.4, "HANDCUFF"],
    ["kaleb-johnson", "Kaleb Johnson", "RB", "GB", 217.5, "HANDCUFF"],
    ["najee-harris", "Najee Harris", "RB", "NYG", 218.4, "LEAD RB / INJURY RISK"],
    ["malachi-fields", "Malachi Fields", "WR", "NYG", 219.3, "ROTATION"],
    ["kayshon-boutte", "Kayshon Boutte", "WR", "HOU", 221.1, "WR2 / ROTATION"],
    ["kyle-williams", "Kyle Williams", "WR", "NE", 222.1, "ROTATION"],
    ["ray-davis", "Ray Davis", "RB", "BUF", 223.7, "HANDCUFF"],
    ["mason-taylor", "Mason Taylor", "TE", "NYJ", 224.3, "TE1 / ROTATION"],
    ["brashard-smith", "Brashard Smith", "RB", "KC", 226.3, "ROTATION"],
    ["isaac-teslaa", "Isaac TeSlaa", "WR", "DET", 226.6, "WR2 / ROTATION"],
    ["pat-bryant", "Pat Bryant", "WR", "DEN", 227.2, "ROTATION"],
    ["bryce-young", "Bryce Young", "QB", "CAR", 227.7, "STARTER QB"],
    ["michael-penix", "Michael Penix", "QB", "ATL", 227.9, "STARTER QB", "Q", "Questionable; current depth chart lists him behind Tua Tagovailoa"],
    ["aaron-rodgers", "Aaron Rodgers", "QB", "PIT", 228.8, "STARTER QB"],
    ["elijah-sarratt", "Elijah Sarratt", "WR", "BAL", 229.2, "ROTATION"],
    ["chimere-dike", "Chimere Dike", "WR", "TEN", 229.4, "ROTATION"],
    ["greg-dulcich", "Greg Dulcich", "TE", "MIA", 229.7, "TE1 / ROTATION"],
    ["germie-bernard", "Germie Bernard", "WR", "PIT", 229.8, "ROTATION"],
    ["tre-harris", "Tre' Harris", "WR", "LAC", 230.5, "WR2 / ROTATION", "Q", "Questionable for Week 1"],
    ["ryan-flournoy", "Ryan Flournoy", "WR", "DAL", 230.7, "ROTATION"],
    ["adonai-mitchell", "Adonai Mitchell", "WR", "NYJ", 231.0, "WR2 / ROTATION"],
    ["xavier-legette", "Xavier Legette", "WR", "CAR", 285.0, "WR2 / ROTATION", "Q", "Ankle; questionable for Week 1"],
    ["malik-davis", "Malik Davis", "RB", "DAL", 310.0, "HANDCUFF"],
    ["emari-demercado", "Emari Demercado", "RB", "DAL", 340.0, "HANDCUFF"],
    ["bernard-smith", "Bernard Smith", "RB", "KC", 360.0, "ROTATION"],
    ["bam-knight", "Bam Knight", "RB", "ARI", 370.0, "ROTATION"],
    ["justice-hill", "Justice Hill", "RB", "BAL", 375.0, "ROTATION"],
    ["rasheen-ali", "Rasheen Ali", "RB", "BAL", 380.0, "HANDCUFF"],
    ["ty-johnson", "Ty Johnson", "RB", "BUF", 385.0, "ROTATION", "Q", "Lower leg; questionable for Week 1"],
    ["joshua-palmer", "Joshua Palmer", "WR", "BUF", 390.0, "WR2 / ROTATION"],
    ["roschon-johnson", "Roschon Johnson", "RB", "CHI", 395.0, "ROTATION"],
    ["jahan-dotson", "Jahan Dotson", "WR", "ATL", 400.0, "WR2 / ROTATION"],
    ["troy-franklin", "Troy Franklin", "WR", "DEN", 405.0, "WR2 / ROTATION"],
    ["kimani-vidal", "Kimani Vidal", "RB", "LAC", 410.0, "HANDCUFF"],
    ["ronnie-rivers", "Ronnie Rivers", "RB", "LAR", 415.0, "HANDCUFF"],
    ["jordan-whittington", "Jordan Whittington", "WR", "LAR", 420.0, "ROTATION"],
    ["tutu-atwell", "Tutu Atwell", "WR", "LAR", 425.0, "ROTATION"],
    ["tyler-higbee", "Tyler Higbee", "TE", "LAR", 430.0, "TE1 / ROTATION"],
    ["colby-parkinson", "Colby Parkinson", "TE", "LAR", 435.0, "ROTATION"],
    ["ja-tavion-sanders", "Ja'Tavion Sanders", "TE", "JAX", 440.0, "TE1 / ROTATION"],
    ["jonnu-smith", "Jonnu Smith", "TE", "GB", 445.0, "ROTATION"],
    ["demario-douglas", "DeMario Douglas", "WR", "NE", 450.0, "WR2 / SLOT"],
    ["devin-singletary", "Devin Singletary", "RB", "NYG", 455.0, "ROTATION"],
    ["darius-slayton", "Darius Slayton", "WR", "NYG", 460.0, "ROTATION"],
    ["isaiah-davis", "Isaiah Davis", "RB", "NYJ", 465.0, "HANDCUFF", "Q", "Questionable for Week 1"],
    ["jordan-james", "Jordan James", "RB", "SF", 470.0, "HANDCUFF"],
    ["demarcus-robinson", "Demarcus Robinson", "WR", "SF", 475.0, "ROTATION"],
    ["jordan-watkins", "Jordan Watkins", "WR", "SF", 480.0, "ROTATION"],
    ["sean-tucker", "Sean Tucker", "RB", "TB", 485.0, "ROTATION"],
    ["tez-johnson", "Tez Johnson", "WR", "TB", 490.0, "ROTATION"]
  ];

  marketExtras.forEach(([id, name, pos, team, adp, depthRole, status, injury]) => add({ id, name, pos, team, adp, depthRole, status, injury }));

  const kickers = [
    ["brandon-aubrey", "Brandon Aubrey", "DAL", 92.2, 7.0], ["kaimi-fairbairn", "Ka'imi Fairbairn", "HOU", 130.2, 6.8], ["cameron-dicker", "Cameron Dicker", "LAC", 117.9, 6.7], ["cam-little", "Cam Little", "JAX", 135.0, 6.6], ["jason-myers", "Jason Myers", "SEA", 126.3, 6.5], ["eddy-pineiro", "Eddy Pineiro", "SF", 193.9, 6.0], ["tyler-loop", "Tyler Loop", "BAL", 177.6, 6.2], ["evan-mcpherson", "Evan McPherson", "CIN", 181.7, 6.2], ["cairo-santos", "Cairo Santos", "CHI", 270.0, 5.9], ["jake-bates", "Jake Bates", "DET", 139.3, 6.5], ["matt-gay", "Matt Gay", "LV", 280.0, 5.4], ["harrison-mevis", "Harrison Mevis", "LAR", 151.9, 6.2], ["will-reichard", "Will Reichard", "MIN", 171.0, 6.4], ["chase-mclaughlin", "Chase McLaughlin", "TB", 222.3, 6.2], ["chris-boswell", "Chris Boswell", "PIT", 157.8, 6.3], ["wil-lutz", "Wil Lutz", "DEN", 290.0, 5.9], ["harrison-butker", "Harrison Butker", "KC", 175.1, 6.1], ["caden-davis", "Caden Davis", "NYJ", 300.0, 5.4], ["trey-smack", "Trey Smack", "GB", 213.6, 5.0], ["charlie-smyth", "Charlie Smyth", "NO", 310.0, 4.6], ["jake-elliott", "Jake Elliott", "PHI", 217.1, 6.1], ["spencer-shrader", "Spencer Shrader", "IND", 320.0, 5.5, "Q", "Questionable"], ["drew-stevens", "Drew Stevens", "WAS", 330.0, 5.1], ["tyler-bass", "Tyler Bass", "BUF", 340.0, 6.0, "Q", "Questionable"], ["cade-york", "Cade York", "NYJ", 350.0, 4.8], ["riley-patterson", "Riley Patterson", "MIA", 360.0, 5.2], ["andre-szmyt", "Andre Szmyt", "CLE", 370.0, 4.8], ["daniel-carlson", "Daniel Carlson", "NO", 380.0, 5.7], ["dominic-zvada", "Dominic Zvada", "NYG", 390.0, 5.2], ["ryan-fitzgerald", "Ryan Fitzgerald", "CAR", 400.0, 5.1], ["joey-slye", "Joey Slye", "TEN", 410.0, 5.0], ["younghoe-koo", "Younghoe Koo", "FA", 500.0, 4.2, "O", "Free agent; not currently projected as a 2026 team kicker"]
  ];
  kickers.forEach(([id, name, team, adp, proj, status, injury]) => add({ id, name, pos: "K", team, adp, proj, status, injury, depthRole: "STARTER K" }));

  const defenses = [
    ["arizona-defense", "Arizona Defense", "ARI", 430.0, 3.9], ["atlanta-defense", "Atlanta Defense", "ATL", 228.4, 4.9], ["carolina-defense", "Carolina Defense", "CAR", 440.0, 4.8], ["chicago-defense", "Chicago Defense", "CHI", 220.8, 5.0], ["cincinnati-defense", "Cincinnati Defense", "CIN", 450.0, 4.6], ["cleveland-defense", "Cleveland Defense", "CLE", 460.0, 4.4], ["detroit-defense", "Detroit Defense", "DET", 152.0, 5.7], ["green-bay-defense", "Green Bay Defense", "GB", 201.5, 5.1], ["houston-defense", "Houston Defense", "HOU", 97.3, 6.1], ["indianapolis-defense", "Indianapolis Defense", "IND", 219.0, 4.9], ["jacksonville-defense", "Jacksonville Defense", "JAX", 167.7, 5.4], ["kansas-city-defense", "Kansas City Defense", "KC", 259.0, 4.9], ["las-vegas-defense", "Las Vegas Defense", "LV", 240.0, 4.0], ["los-angeles-chargers-defense", "Los Angeles Chargers Defense", "LAC", 179.0, 5.1], ["los-angeles-rams-defense", "Los Angeles Rams Defense", "LAR", 87.5, 6.2], ["miami-defense", "Miami Defense", "MIA", 470.0, 3.7], ["minnesota-defense", "Minnesota Defense", "MIN", 150.7, 5.4], ["new-york-giants-defense", "New York Giants Defense", "NYG", 470.0, 5.0], ["new-york-jets-defense", "New York Jets Defense", "NYJ", 480.0, 3.8], ["new-orleans-defense", "New Orleans Defense", "NO", 470.0, 4.5], ["tampa-bay-defense", "Tampa Bay Defense", "TB", 470.0, 4.8], ["tennessee-defense", "Tennessee Defense", "TEN", 470.0, 3.9], ["washington-defense", "Washington Defense", "WAS", 470.0, 4.4]
  ];
  defenses.forEach(([id, name, team, adp, proj]) => add({ id, name, pos: "DEF", team, adp, proj, depthRole: "STARTER UNIT" }));

  board.asOf = "2026-08-31";
})();
