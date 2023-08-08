import { Lists } from '.keystone/types';
import { Bid } from './schema/Bid';
import { Contract } from "./schema/Contract";
import { ContractLogEntry } from "./schema/ContractLogEntry";
import { DraftPick } from "./schema/DraftPick";
import { Player } from "./schema/Player";
import { Team } from "./schema/Team";
import { Trade } from "./schema/Trade";
import { User } from "./schema/User";
import { FreeAgencyCalendar } from "./schema/FreeAgencyCalendar";
import { list } from '@keystone-6/core';

export const lists: Lists = {
  Bid,
  Contract,
  ContractLogEntry,
  DraftPick,
  Player,
  Team,
  Trade,
  User,
  FreeAgencyCalendar,
};
