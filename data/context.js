/*
 * Transparent fantasy context layer for the recommendation card.
 * Style and fit are directional categories synthesized from TEAMS.md,
 * current depth charts, 2025 run/pass tendencies, and 2026 role reports.
 */
window.FANTASY_CONTEXT = {
  asOf: "2026-08-31",
  systems: {
    ARI: { style: "PASS-LEANING", qb: "VOLATILE", shape: "MCCBRIDE-LED", fit: { QB: "NEUTRAL", RB: "NEUTRAL", WR: "NEUTRAL", TE: "STRONG" } },
    ATL: { style: "BALANCED", qb: "VOLATILE", shape: "BIJAN/LONDON-LED", fit: { QB: "NEUTRAL", RB: "STRONG", WR: "NEUTRAL", TE: "NEUTRAL" } },
    BAL: { style: "RUN-LEANING", qb: "ELITE", shape: "CONCENTRATED", fit: { QB: "ELITE", RB: "STRONG", WR: "NEUTRAL", TE: "STRONG" } },
    BUF: { style: "BALANCED", qb: "ELITE", shape: "ALLEN-LED", fit: { QB: "ELITE", RB: "STRONG", WR: "STRONG", TE: "NEUTRAL" } },
    CAR: { style: "BALANCED", qb: "VOLATILE", shape: "MCMILLAN-LED", fit: { QB: "NEUTRAL", RB: "STRONG", WR: "NEUTRAL", TE: "NEUTRAL" } },
    CHI: { style: "PASS-LEANING", qb: "STRONG", shape: "CONCENTRATED", fit: { QB: "STRONG", RB: "NEUTRAL", WR: "STRONG", TE: "STRONG" } },
    CIN: { style: "PASS-HEAVY", qb: "STRONG", shape: "CHASE-LED", fit: { QB: "STRONG", RB: "NEUTRAL", WR: "STRONG", TE: "NEUTRAL" } },
    CLE: { style: "PASS-HEAVY", qb: "WEAK", shape: "SPREAD", fit: { QB: "WEAK", RB: "NEUTRAL", WR: "WEAK", TE: "NEUTRAL" } },
    DAL: { style: "PASS-HEAVY", qb: "STRONG", shape: "LAMB-LED", fit: { QB: "STRONG", RB: "NEUTRAL", WR: "STRONG", TE: "NEUTRAL" } },
    DEN: { style: "PASS-HEAVY", qb: "NEUTRAL", shape: "SPREAD", fit: { QB: "NEUTRAL", RB: "NEUTRAL", WR: "NEUTRAL", TE: "NEUTRAL" } },
    DET: { style: "PASS-HEAVY", qb: "STRONG", shape: "GIBBS/ST-BROWN-LED", fit: { QB: "STRONG", RB: "STRONG", WR: "STRONG", TE: "NEUTRAL" } },
    GB: { style: "BALANCED", qb: "STRONG", shape: "SPREAD", fit: { QB: "STRONG", RB: "STRONG", WR: "NEUTRAL", TE: "NEUTRAL" } },
    HOU: { style: "PASS-HEAVY", qb: "STRONG", shape: "NICO-LED", fit: { QB: "STRONG", RB: "NEUTRAL", WR: "STRONG", TE: "NEUTRAL" } },
    IND: { style: "PASS-HEAVY", qb: "VOLATILE", shape: "TAYLOR-LED", fit: { QB: "NEUTRAL", RB: "STRONG", WR: "NEUTRAL", TE: "STRONG" } },
    JAX: { style: "PASS-HEAVY", qb: "STRONG", shape: "BTJ-LED", fit: { QB: "STRONG", RB: "NEUTRAL", WR: "STRONG", TE: "NEUTRAL" } },
    KC: { style: "PASS-HEAVY", qb: "STRONG", shape: "RICE-LED", fit: { QB: "STRONG", RB: "NEUTRAL", WR: "STRONG", TE: "NEUTRAL" } },
    LAC: { style: "PASS-HEAVY", qb: "STRONG", shape: "CONCENTRATED", fit: { QB: "STRONG", RB: "STRONG", WR: "STRONG", TE: "NEUTRAL" } },
    LAR: { style: "PASS-HEAVY", qb: "STRONG", shape: "PUKA-LED", fit: { QB: "STRONG", RB: "STRONG", WR: "STRONG", TE: "STRONG" } },
    LV: { style: "PASS-HEAVY", qb: "VOLATILE", shape: "JEANTY/BOWERS-LED", fit: { QB: "NEUTRAL", RB: "STRONG", WR: "WEAK", TE: "STRONG" } },
    MIA: { style: "PASS-HEAVY", qb: "VOLATILE", shape: "ACHANE-LED", fit: { QB: "NEUTRAL", RB: "STRONG", WR: "WEAK", TE: "NEUTRAL" } },
    MIN: { style: "PASS-HEAVY", qb: "STRONG", shape: "JEFFERSON-LED", fit: { QB: "STRONG", RB: "NEUTRAL", WR: "STRONG", TE: "NEUTRAL" } },
    NE: { style: "BALANCED", qb: "STRONG", shape: "BROWN/STEVENSON-LED", fit: { QB: "STRONG", RB: "STRONG", WR: "STRONG", TE: "NEUTRAL" } },
    NO: { style: "PASS-HEAVY", qb: "VOLATILE", shape: "OLAVE-LED", fit: { QB: "NEUTRAL", RB: "NEUTRAL", WR: "NEUTRAL", TE: "NEUTRAL" } },
    NYG: { style: "PASS-HEAVY", qb: "VOLATILE", shape: "NABERS/SKATTEBO-LED", fit: { QB: "NEUTRAL", RB: "NEUTRAL", WR: "NEUTRAL", TE: "NEUTRAL" } },
    NYJ: { style: "PASS-HEAVY", qb: "NEUTRAL", shape: "WILSON/HALL-LED", fit: { QB: "NEUTRAL", RB: "STRONG", WR: "NEUTRAL", TE: "NEUTRAL" } },
    PHI: { style: "BALANCED", qb: "ELITE", shape: "HURTS/BARKLEY-LED", fit: { QB: "ELITE", RB: "STRONG", WR: "STRONG", TE: "NEUTRAL" } },
    PIT: { style: "PASS-HEAVY", qb: "VOLATILE", shape: "DK/PITTMAN-LED", fit: { QB: "NEUTRAL", RB: "NEUTRAL", WR: "NEUTRAL", TE: "NEUTRAL" } },
    SF: { style: "PASS-HEAVY", qb: "STRONG", shape: "CMC/KITTLE-LED", fit: { QB: "STRONG", RB: "STRONG", WR: "NEUTRAL", TE: "STRONG" } },
    SEA: { style: "BALANCED", qb: "NEUTRAL", shape: "JSN-LED", fit: { QB: "NEUTRAL", RB: "NEUTRAL", WR: "STRONG", TE: "NEUTRAL" } },
    TB: { style: "PASS-HEAVY", qb: "STRONG", shape: "EVANS/GODWIN-LED", fit: { QB: "STRONG", RB: "NEUTRAL", WR: "STRONG", TE: "NEUTRAL" } },
    TEN: { style: "PASS-HEAVY", qb: "VOLATILE", shape: "SPREAD", fit: { QB: "NEUTRAL", RB: "NEUTRAL", WR: "WEAK", TE: "NEUTRAL" } },
    WAS: { style: "BALANCED", qb: "ELITE", shape: "DANIELS/MCLAURIN-LED", fit: { QB: "ELITE", RB: "STRONG", WR: "STRONG", TE: "NEUTRAL" } }
  },
  roles: {
    "jahmyr-gibbs": "LEAD RB", "bijan-robinson": "LEAD RB", "christian-mccaffrey": "LEAD RB", "jonathan-taylor": "LEAD RB", "devon-achane": "LEAD RB", "james-cook": "LEAD RB", "derrick-henry": "LEAD RB", "saquon-barkley": "LEAD RB", "kyren-williams": "LEAD RB", "breece-hall": "LEAD RB", "ashton-jeanty": "LEAD RB", "omarion-hampton": "LEAD RB", "javonte-williams": "LEAD RB", "dandre-swift": "LEAD RB", "bucky-irving": "LEAD RB", "quinshon-judkins": "LEAD RB", "bhayshul-tuten": "LEAD RB", "rhamondre-stevenson": "LEAD RB", "tony-pollard": "LEAD RB", "cam-skatttebo": "LEAD RB", "travis-etienne": "LEAD RB", "jk-dobbins": "LEAD RB", "kenneth-walker": "LEAD RB", "josh-jacobs": "LEAD RB", "james-conner": "LEAD RB",
    "chase-brown": "LEAD RB", "david-montgomery": "RB1 / ROTATION", "jaylen-warren": "RB1 / ROTATION", "rj-harvey": "RB2 / ROTATION", "treveyon-henderson": "RB2 / ROTATION", "rico-dowdle": "RB2 / ROTATION", "tank-bigsby": "HANDCUFF", "blake-corum": "HANDCUFF", "jordan-mason": "HANDCUFF", "tyler-allgeier": "HANDCUFF", "braelon-allen": "HANDCUFF", "jaylen-wright": "HANDCUFF", "jadarian-price": "HANDCUFF", "zach-charbonnet": "LEAD RB / INJURY RISK", "marshawn-lloyd": "HANDCUFF", "kyle-monangai": "RB2 / ROTATION", "kendre-miller": "ROTATION", "woody-marks": "HANDCUFF", "dylan-sampson": "ROTATION", "tyrone-tracy-jr": "ROTATION", "lequint-allen": "HANDCUFF", "trey-benson": "HANDCUFF", "brian-robinson-jr": "RB2 / ROTATION", "chris-rodriguez-jr": "HANDCUFF", "jaleel-mclaughlin": "ROTATION", "tyjae-spears": "RB2 / ROTATION",
    "puka-nacua": "WR1", "jamarr-chase": "WR1", "jaxon-smith-njigba": "WR1", "amon-ra-st-brown": "WR1", "ceedee-lamb": "WR1", "drake-london": "WR1", "justin-jefferson": "WR1", "rashee-rice": "WR1", "aj-brown": "WR1", "chris-olave": "WR1", "garrett-wilson": "WR1", "zay-flowers": "WR1 / SLOT", "malik-nabers": "WR1", "devonta-smith": "WR2", "tetairoa-mcmillan": "WR1", "nico-collins": "WR1", "tee-higgins": "WR2", "ladd-mcconkey": "WR1 / SLOT", "davante-adams": "WR1", "jameson-williams": "WR2", "jaylen-waddle": "WR1", "terry-mclaurin": "WR1", "dj-moore": "WR1", "rome-odunze": "WR1 / ROTATION", "mike-evans": "WR1", "marvin-harrison-jr": "WR1", "dk-metcalf": "WR1", "brian-thomas-jr": "WR1", "michael-pittman-jr": "WR1", "michael-wilson": "WR2", "jakobi-meyers": "WR2", "stefon-diggs": "WR1", "jayden-reed": "WR2 / SLOT", "jauan-jennings": "WR2 / SLOT", "calvin-ridley": "WR1", "deebo-samuel": "WR2 / YAC", "keenan-allen": "WR1 / SLOT", "khalil-shakir": "WR2 / SLOT", "jordan-addison": "WR2", "xavier-worthy": "WR2", "keon-coleman": "WR3 / RED ZONE", "carnell-tate": "WR1", "wandale-robinson": "WR2 / SLOT", "parker-washington": "WR2 / ROTATION", "rashid-shaheed": "WR2 / BIG PLAY", "christian-kirk": "WR2 / SLOT", "marvin-mims-jr": "WR2 / ROTATION", "tory-horton": "WR2 / ROTATION", "tre-tucker": "WR1 / ROTATION", "jalen-nailor": "WR2 / ROTATION", "darnell-mooney": "WR2", "odell-beckham-jr": "ROTATION", "ricky-pearsall": "WR2 / INJURY RISK", "makai-lemon": "ROTATION", "jalen-mcmillan": "WR2 / ROTATION", "tyreek-hill": "WR1 / INJURY RISK", "jordyn-tyson": "WR2 / ROTATION", "calvin-austin": "ROTATION",
    "trey-mcbride": "TE1", "brock-bowers": "TE1", "colston-loveland": "TE1", "tyler-warren": "TE1", "kyle-pitts": "TE1", "harold-fannin": "TE1", "sam-laporta": "TE1", "george-kittle": "TE1", "mark-andrews": "TE1", "jake-ferguson": "TE1", "dallas-goedert": "TE1", "isaiah-likely": "TE1 / ROTATION", "tucker-kraft": "TE1", "terrance-ferguson": "TE1", "jake-tonges": "ROTATION", "hunter-henry": "TE1", "pat-freiermuth": "TE1", "theo-johnson": "TE1",
    "josh-allen": "ELITE QB", "lamar-jackson": "ELITE QB", "joe-burrow": "STARTER QB", "drake-maye": "STARTER QB", "dak-prescott": "STARTER QB", "jayden-daniels": "ELITE QB", "matthew-stafford": "STARTER QB", "jalen-hurts": "ELITE QB", "brock-purdy": "STARTER QB", "caleb-williams": "STARTER QB", "trevor-lawrence": "STARTER QB", "justin-herbert": "STARTER QB", "bo-nix": "STARTER QB", "jaxson-dart": "STARTER QB", "patrick-mahomes": "STARTER QB / INJURY RISK", "baker-mayfield": "STARTER QB", "kyler-murray": "STARTER QB", "sam-darnold": "STARTER QB", "tyler-shough": "STARTER QB", "cam-ward": "STARTER QB", "tua-tagovailoa": "STARTER QB", "cj-stroud": "STARTER QB", "geno-smith": "STARTER QB", "daniel-jones": "STARTER QB", "jj-mccarthy": "STARTER QB / INJURY RISK",
    "brandon-aubrey": "STARTER K", "harrison-butker": "STARTER K", "jake-bates": "STARTER K", "cameron-dicker": "STARTER K", "jake-moody": "STARTER K", "younghoe-koo": "STARTER K", "jason-sanders": "STARTER K", "kaimi-fairbairn": "STARTER K",
    "seattle-defense": "STARTER UNIT", "denver-defense": "STARTER UNIT", "philadelphia-defense": "STARTER UNIT", "baltimore-defense": "STARTER UNIT", "pittsburgh-defense": "STARTER UNIT", "san-francisco-defense": "STARTER UNIT", "buffalo-defense": "STARTER UNIT", "kansas-city-defense": "STARTER UNIT", "dallas-defense": "STARTER UNIT", "new-england-defense": "STARTER UNIT"
  }
};
