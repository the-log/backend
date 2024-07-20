export interface Player {
  draftAuctionValue: number;
  id:                number;
  keeperValue:       number;
  keeperValueFuture: number;
  lineupLocked:      boolean;
  onTeamId:          number;
  player:            PlayerClass;
  ratings?:          Ratings;
  rosterLocked:      boolean;
  status:            Status;
  tradeLocked:       boolean;
}

export interface PlayerClass {
  active:               boolean;
  defaultPositionId:    number;
  draftRanksByRankType: DraftRanksByRankType;
  droppable:            boolean;
  eligibleSlots:        number[];
  firstName:            string;
  fullName:             string;
  id:                   number;
  injured:              boolean;
  injuryStatus?:        InjuryStatus;
  jersey?:              string;
  lastName:             string;
  ownership?:           Ownership;
  proTeamId:            number;
  stats:                Stat[];
  seasonOutlook?:       string;
  outlooks?:            any;
}

export interface DraftRanksByRankType {
  PPR:      Ppr;
  STANDARD: Ppr;
}

export interface Ppr {
  auctionValue: number;
  published:    boolean;
  rank:         number;
  rankSourceId: number;
  rankType:     RankType;
  slotId:       number;
}

export enum RankType {
  Ppr = "PPR",
  Standard = "STANDARD",
}

export type InjuryStatus = "ACTIVE" | "QUESTIONABLE" | "OUT" | "SUSPENSION";

export interface Ownership {
  activityLevel:                     null;
  auctionValueAverage:               number;
  auctionValueAverageChange:         number;
  averageDraftPosition:              number;
  averageDraftPositionPercentChange: number;
  date:                              null;
  leagueType:                        number;
  percentChange:                     number;
  percentOwned:                      number;
  percentStarted:                    number;
}

export interface Stat {
  appliedTotal:    number;
  externalId:      string;
  id:              string;
  proTeamId:       number;
  scoringPeriodId: number;
  seasonId:        number;
  statSourceId:    number;
  statSplitTypeId: number;
  stats:           { [key: string]: number };
  appliedAverage?: number;
}

export interface Ratings {
  "0": Rankings;
}

export interface Rankings {
  positionalRanking: number;
  totalRanking:      number;
  totalRating:       number;
}

export enum Status {
  Freeagent = "FREEAGENT",
  Onteam = "ONTEAM",
}

export interface Team {
  abbrev:                string;
  currentProjectedRank:  number;
  divisionId:            number;
  draftDayProjectedRank: number;
  id:                    number;
  isActive:              boolean;
  logo:                  string;
  logoType:              any;
  name:                  string;
  owners:                string[];
  playoffSeed:           number;
  points:                number;
  pointsAdjusted:        number;
  pointsDelta:           number;
  primaryOwner:          string;
  rankCalculatedFinal:   number;
  rankFinal:             number;
  record:                Record;
  roster:                any;
  tradeBlock:            any;
  transactionCounter:    any;
  waiverRank:            number;
  draftStrategy?:        any;
}

export interface Record {
  away:     RecordDetails;
  division: RecordDetails;
  home:     RecordDetails;
  overall:  RecordDetails;
}

export interface RecordDetails {
  gamesBack:     number;
  losses:        number;
  percentage:    number;
  pointsAgainst: number;
  pointsFor:     number;
  streakLength:  number;
  streakType:    string;
  ties:          number;
  wins:          number;
}
