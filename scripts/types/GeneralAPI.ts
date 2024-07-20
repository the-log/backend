export interface GeneralPlayer {
  $ref:           string;
  id:             string;
  uid:            string;
  guid:           string;
  type:           string;
  alternateIds:   AlternateIDS;
  firstName:      string;
  lastName:       string;
  fullName:       string;
  displayName:    string;
  shortName:      string;
  weight:         number;
  displayWeight:  string;
  height:         number;
  displayHeight:  string;
  age:            number;
  dateOfBirth:    string;
  debutYear:      number;
  links:          Link[];
  birthPlace:     BirthPlace;
  college:        College;
  slug:           string;
  headshot:       Headshot;
  jersey?:        string;
  position:       Position;
  linked:         boolean;
  team?:          College;
  statistics?:    College;
  contracts:      College;
  experience:     Experience;
  collegeAthlete: College;
  active:         boolean;
  draft?:         Draft;
  status:         Status;
  statisticslog?: College;
}

export interface AlternateIDS {
  sdr: string;
}

export interface BirthPlace {
  city?:    string;
  state?:   string;
  country?: string;
}

export interface College {
  $ref: string;
}

export interface Draft {
  displayText: string;
  round:       number;
  year:        number;
  selection:   number;
  team:        College;
}

export interface Experience {
  years: number;
}

export interface Headshot {
  href: string;
  alt:  string;
}

export interface Link {
  language:   Language;
  rel:        string[];
  href:       string;
  text:       string;
  shortText:  string;
  isExternal: boolean;
  isPremium:  boolean;
}

export enum Language {
  EnUS = "en-US",
}

export interface Position {
  $ref:         string;
  id:           string;
  name:         string;
  displayName:  string;
  abbreviation: string;
  leaf:         boolean;
  parent?:      College;
}

export interface Status {
  id:           string;
  name:         string;
  type:         string;
  abbreviation: string;
}
