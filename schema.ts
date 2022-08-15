import { Lists } from '.keystone/types';
import { Bid } from './schema/Bid';
import { Contract } from "./schema/Contract";
import { DraftPick } from "./schema/DraftPick";
import { Player } from "./schema/Player";
import { Team } from "./schema/Team";
import { Trade } from "./schema/Trade";
import { User } from "./schema/User";

export const lists: Lists = {
  Bid,
  Contract,
  DraftPick,
  Player,
  Team,
  Trade,
  User
};
