/*
 * Last pre-draft refresh: Aug. 31, 2026.
 *
 * This is deliberately a small overlay instead of another copy of the board.
 * It keeps the app static while making the latest market, availability, and
 * depth-chart changes easy to audit or replace before the draft.
 */
(() => {
  const board = window.FANTASY_BOARD;
  const players = board.players;
  const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  function find(id, name) {
    return players.find((p) => p.id === id) || players.find((p) => normalize(p.name) === normalize(name));
  }

  function update(id, name, changes) {
    const player = find(id, name);
    if (player) Object.assign(player, changes);
  }

  // Current PPR market order, using the Sleeper-primary ADP snapshot at
  // FantasyDraft.io. Supplemental players already carry these values in pool.js.
  const latestAdp = {
    "jahmyr-gibbs": 1.5, "bijan-robinson": 2.1, "jamarr-chase": 3.9, "puka-nacua": 4.7,
    "christian-mccaffrey": 5.1, "jaxon-smith-njigba": 6.5, "jonathan-taylor": 7.3,
    "amon-ra-st-brown": 7.8, "ceedee-lamb": 9.8, "james-cook": 10.4, "justin-jefferson": 11.3,
    "devon-achane": 12.5, "saquon-barkley": 13.7, "ashton-jeanty": 14.7, "chase-brown": 15.1,
    "omarion-hampton": 15.7, "drake-london": 17.8, "aj-brown": 18.2, "kenneth-walker": 19.4,
    "derrick-henry": 20.2, "josh-allen": 21.6, "trey-mcbride": 22.9, "brock-bowers": 23.4,
    "george-pickens": 23.5, "nico-collins": 25.2, "jeremiyah-love": 26.3, "malik-nabers": 27.0,
    "rashee-rice": 28.0, "kyren-williams": 29.5, "chris-olave": 30.0, "lamar-jackson": 31.2,
    "josh-jacobs": 31.2, "breece-hall": 33.6, "tee-higgins": 34.3, "javonte-williams": 35.9,
    "devonta-smith": 36.3, "tetairoa-mcmillan": 37.9, "ladd-mcconkey": 38.1,
    "colston-loveland": 39.1, "emeka-egbuka": 39.2, "zay-flowers": 41.0, "bucky-irving": 42.3,
    "cam-skatttebo": 43.2, "travis-etienne": 44.7, "garrett-wilson": 45.9, "jaylen-waddle": 46.1,
    "tyler-warren": 47.6, "drake-maye": 47.9, "david-montgomery": 49.3, "davante-adams": 50.5,
    "joe-burrow": 51.8, "dandre-swift": 52.0, "quinshon-judkins": 53.1, "luther-burden": 54.7,
    "terry-mclaurin": 55.3, "treveyon-henderson": 55.5, "dj-moore": 57.8, "jameson-williams": 58.3,
    "sam-laporta": 59.6, "jalen-hurts": 60.0, "mike-evans": 61.4, "bhayshul-tuten": 62.8,
    "tucker-kraft": 63.3, "rome-odunze": 63.6, "jayden-daniels": 65.2, "carnell-tate": 66.3,
    "jadarian-price": 67.5, "kyle-pitts": 68.2, "harold-fannin": 69.4, "christian-watson": 70.0,
    "caleb-williams": 71.1, "jaylen-warren": 71.9, "brian-thomas-jr": 73.5, "dk-metcalf": 74.6,
    "parker-washington": 75.7, "marvin-harrison-jr": 76.7, "dak-prescott": 77.7,
    "chuba-hubbard": 78.6, "courtland-sutton": 79.1, "rhamondre-stevenson": 81.8,
    "justin-herbert": 82.4, "michael-wilson": 83.9, "tony-pollard": 84.9, "rico-dowdle": 85.0,
    "george-kittle": 86.8, "travis-kelce": 90.6, "jaxson-dart": 91.8, "brandon-aubrey": 92.2,
    "jordyn-tyson": 93.3, "jk-dobbins": 94.8, "chris-godwin": 95.7, "matthew-stafford": 96.0,
    "jake-ferguson": 98.4, "alec-pierce": 99.0, "kyle-monangai": 100.6,
    "trevor-lawrence": 101.6, "blake-corum": 102.5, "michael-pittman-jr": 103.6,
    "jordan-addison": 103.9, "jonathon-brooks": 106.1, "isaiah-likely": 107.4,
    "patrick-mahomes": 108.8, "stefon-diggs": 109.7, "josh-downs": 110.7, "jayden-reed": 111.0,
    "kenny-gainwell": 111.4, "jordan-mason": 114.0, "wandale-robinson": 116.6,
    "cameron-dicker": 117.9, "bo-nix": 119.5, "jakobi-meyers": 119.9, "dallas-goedert": 122.4,
    "brock-purdy": 123.2, "aaron-jones": 125.2, "mark-andrews": 128.0, "deebo-samuel": 129.0,
    "kaimi-fairbairn": 130.2, "rachaad-white": 132.1, "jared-goff": 134.9, "jake-bates": 139.3,
    "xavier-worthy": 140.5, "chris-rodriguez-jr": 141.7, "hunter-henry": 142.5,
    "khalil-shakir": 143.5, "baker-mayfield": 143.9, "tyler-allgeier": 145.2,
    "rashid-shaheed": 147.1, "zach-charbonnet": 148.8, "jordan-love": 149.9,
    "kyler-murray": 158.1, "sam-darnold": 160.0, "tyjae-spears": 162.2, "woody-marks": 159.2
  };

  Object.entries(latestAdp).forEach(([id, adp]) => update(id, "", { adp }));

  // Availability and depth-chart changes checked against the current CBS/PFN
  // injury pages plus the Aug. 31 PFF fantasy depth-chart refresh.
  update("james-conner", "James Conner", { status: "O", injury: "Injured reserve; not projected for Week 1" });
  update("josh-jacobs", "Josh Jacobs", { status: "O", injury: "Out; current Green Bay chart lists MarShawn Lloyd first" });
  update("jordyn-tyson", "Jordyn Tyson", { status: "O", injury: "Injured reserve" });
  update("devin-neal", "Devin Neal", { status: "O", injury: "Injured reserve" });
  update("emeka-egbuka", "Emeka Egbuka", { status: "Q", injury: "Questionable for Week 1" });
  update("luther-burden", "Luther Burden III", { status: "Q", injury: "Questionable for Week 1" });
  update("michael-penix", "Michael Penix", { status: "Q", injury: "Questionable; current chart lists him behind Tua Tagovailoa" });
  update("isiah-pacheco", "Isiah Pacheco", { status: "Q", injury: "Questionable; current chart lists him in Detroit's RB rotation" });
  update("xavier-legette", "Xavier Legette", { status: "Q", injury: "Questionable for Week 1" });
  update("ty-johnson", "Ty Johnson", { status: "Q", injury: "Questionable for Week 1" });
  update("jake-moody", "Jake Moody", { status: "O", injury: "Not currently projected as San Francisco's starter; Eddy Pineiro is listed first" });
  update("younghoe-koo", "Younghoe Koo", { team: "FA", bye: 0, status: "O", injury: "Free agent; not currently projected as a 2026 team kicker" });
  update("jason-sanders", "Jason Sanders", { team: "NYJ", bye: 13 });
  update("jauan-jennings", "Jauan Jennings", { team: "MIN", bye: 6 });

  // The current charts move these contingency values into the recommendation
  // tags, which is especially important when the starter is unavailable.
  update("marshawn-lloyd", "MarShawn Lloyd", { depthRole: "LEAD RB" });
  update("kaleb-johnson", "Kaleb Johnson", { depthRole: "HANDCUFF" });
  update("malik-davis", "Malik Davis", { depthRole: "HANDCUFF" });
  if (window.FANTASY_CONTEXT) {
    window.FANTASY_CONTEXT.asOf = "2026-08-31";
    window.FANTASY_CONTEXT.roles["marshawn-lloyd"] = "LEAD RB";
  }
  board.asOf = "2026-08-31";
})();
