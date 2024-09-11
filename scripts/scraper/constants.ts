import 'dotenv/config';

// Secret Shit
export const { LEAGUE_ID, ESPN_S2, SWID, URL } = process.env;

// ESPN API Parts
// base + year + segments + league_id + query
export const fantasyApi = {
  base: 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons',
  // base: 'https://fantasy.espn.com/apis/v3/games/ffl/seasons',
  segments: 'segments/0/leagues',
  player_query: 'view=kona_player_info',
  team_query: 'view=mRoster&view=mTeam',
  settings_query: 'view=mSettings',
  opt: {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `espn_s2=${ESPN_S2}; SWID=${SWID};`,
      'X-Fantasy-Filter': `{"players":{"filterSlotIds":{"value":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,23,24]},"filterRanksForScoringPeriodIds":{"value":[1]},"limit":3000,"offset":0,"sortPercOwned":{"sortAsc":false,"sortPriority":1},"sortDraftRanks":{"sortPriority":100,"sortAsc":true,"value":"STANDARD"},"filterRanksForRankTypes":{"value":["PPR"]},"filterRanksForSlotIds":{"value":[0,2,4,6,17,16,8,9,10,12,13,24,11,14,15]}}}`
    },
  },
}

export const generalApi = {
  base: 'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl'
}

// key/value map for player position labels
export const positionMap = {
  "0": 'QB',
  "1": 'QB',
  "2": 'RB',
  "3": 'WR',
  "4": 'TE',
  "5": 'K',
  "9": 'DT',
  "10": 'DE',
  "11": 'LB',
  "12": 'CB',
  "13": 'S',
};

export const positionWeight = {
  'QB': 0,
  'RB': 1,
  'WR': 2,
  'TE': 3,
  'K' : 4,
  'DE': 5,
  'DL': 5,
  'DT': 5,
  'LB': 6,
  'CB': 7,
  'S' : 7,
}

// key/value map for player team labels
export const teamMap = {
  "-1": 'Bye',
  "1" : 'ATL',
  "2" : 'BUF',
  "3" : 'CHI',
  "4" : 'CIN',
  "5" : 'CLE',
  "6" : 'DAL',
  "7" : 'DEN',
  "8" : 'DET',
  "9" : 'GB',
  "10": 'TEN',
  "11": 'IND',
  "12": 'KC',
  "13": 'LV',
  "14": 'LAR',
  "15": 'MIA',
  "16": 'MIN',
  "17": 'NE',
  "18": 'NO',
  "19": 'NYG',
  "20": 'NYJ',
  "21": 'PHI',
  "22": 'ARI',
  "23": 'PIT',
  "24": 'LAC',
  "25": 'SF',
  "26": 'SEA',
  "27": 'TB',
  "28": 'WSH',
  "29": 'CAR',
  "30": 'JAX',
  "33": 'BAL',
  "34": 'HOU'
};

// TODO: Decipher the stat keys
// key/value map for player stat labels
export const statMap = {}
