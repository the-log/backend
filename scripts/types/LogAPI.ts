export interface Player {
  espn_id:            number;
  name:               string;
  age:                number;
  height:             number;
  weight:             number;
  debutYear:          number;
  draftYear:          number | null;
  draftRound:         number | null;
  draftSelection:     number | null;
  team:               string;
  position:           string;
  positionWeight:     number;
  isIrEligible:       boolean;
  injuryStatus:       InjuryStatus;
  positionRank:       number;
  overallRank:        number;
  positionRankProj:   number;
  overallRankProj:    number;
  seasonOutlook?:     string;
  outlooksByWeek:     OutlooksByWeek;
  isRookie:           boolean;
  fullStats:          FullStats;
  pointsLastYear:     number;
  pointsThisYear:     number;
  pointsThisYearProj: number;
  pointsThisWeekProj: number;
  splits:             Split[];
}

export interface Team {
  espn_id:             number;
  name:                string;
  logo:                string;
  abbreviation:        string;
  projectedRank:       number;
  rankCalculatedFinal: number;
  playoffSeed:         number;
  wins:                number;
  losses:              number;
  ties:                number;
  pointsFor:           number;
  pointsAgainst:       number;
  percentage:          number;
  gamesBack:           number;
  streakLength:        number;
  streakType:          string;
}

export interface Contract {
  id:                string;
  node_id:           number;
  salary:            number;
  years:             number;
  status:            "active" | "dts" | "ir" | "waived";
  teamId?:           string;
  playerId?:         string;
  needsAttention:    boolean;
  isFranchiseTagged: boolean;
}

export interface ContractTotals {
  salary: number;
  years:  number;
  active: number;
  dts:    number;
  ir:     number;
  waived: number;
}

export interface Owner {
  id:                      string;
  name:                    string;
  email:                   string;
  password:                Password;
  isAdmin:                 boolean;
  isOwner:                 boolean;
  passwordResetToken:      null;
  passwordResetIssuedAt:   null;
  passwordResetRedeemedAt: null;
  magicAuthToken:          null;
  magicAuthIssuedAt:       null;
  magicAuthRedeemedAt:     null;
}

export interface Password {
  isSet: boolean;
}

export interface ContractPlayer {
  id:                 string;
  espn_id:            number;
  name:               string;
  age:                number;
  height:             number;
  weight:             number;
  debutYear:          number;
  draftYear:          number | null;
  draftRound:         number | null;
  draftSelection:     number | null;
  team:               string;
  position:           string;
  positionWeight:     number;
  isIrEligible:       boolean;
  injuryStatus:       InjuryStatus;
  positionRank:       number;
  overallRank:        number;
  positionRankProj:   number;
  overallRankProj:    number;
  seasonOutlook:      string;
  outlooksByWeek:     OutlooksByWeek;
  isRookie:           boolean;
  fullStats:          FullStats;
  pointsLastYear:     number;
  pointsThisYear:     number;
  pointsThisYearProj: number;
  pointsThisWeekProj: number;
  splits:             Split[];
}

export interface FullStats {
  lastYearActual: StatSet;
  thisYearActual: StatSet;
  thisWeekProjected: StatSet;
  thisYearProjected: StatSet;
}

export interface StatSet {
  id:              string;
  stats:           { [key: string]: number };
  title:           string;
  seasonId:        number;
  proTeamId:       number;
  externalId:      string;
  appliedTotal:    number;
  statSourceId:    number;
  appliedAverage:  number;
  scoringPeriodId: number;
  statSplitTypeId: number;
}

export type InjuryStatus = "ACTIVE" | "QUESTIONABLE" | "OUT" | "SUSPENSION";

export interface OutlooksByWeek {
}

export interface Split {
  name:             Name;
  stats:            Stat[];
  summary:          string;
  displayName:      DisplayName;
  abbreviation:     Abbreviation;
  shortDisplayName: DisplayName;
}

export enum Abbreviation {
  Def = "def",
  Defint = "defint",
  Gen = "gen",
  Kick = "kick",
  Pass = "pass",
  Punt = "punt",
  Rec = "rec",
  Rush = "rush",
  S = "s",
}

export enum DisplayName {
  Defensive = "Defensive",
  DefensiveInterceptions = "Defensive Interceptions",
  General = "General",
  Kicking = "Kicking",
  Passing = "Passing",
  Punting = "Punting",
  Receiving = "Receiving",
  Rushing = "Rushing",
  Scoring = "Scoring",
}

export enum Name {
  Defensive = "defensive",
  DefensiveInterceptions = "defensiveInterceptions",
  General = "general",
  Kicking = "kicking",
  Passing = "passing",
  Punting = "punting",
  Receiving = "receiving",
  Rushing = "rushing",
  Scoring = "scoring",
}

export interface Stat {
  name:                 string;
  value:                number;
  description:          string;
  displayName:          string;
  abbreviation:         string;
  displayValue:         string;
  shortDisplayName:     string;
  rank?:                number;
  rankDisplayValue?:    string;
  perGameValue?:        number;
  perGameDisplayValue?: string;
}
