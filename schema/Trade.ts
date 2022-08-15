import { list } from '@keystone-6/core';
import {
  relationship,
  timestamp,
  checkbox,
} from '@keystone-6/core/fields';
import { tradeAccess } from '../utils/access';

export const Trade = list({
  fields: {
    teamOne: relationship({
      ref: 'Team',
      many: false,
    }),
    teamOneContracts: relationship({
      ref: 'Contract',
      many: true,
    }),
    teamOneDraftPicks: relationship({
      ref: 'DraftPick',
      many: true,
    }),
    teamOneApproves: checkbox(),
    teamTwo: relationship({
      ref: 'Team',
      many: false,
    }),
    teamTwoContracts: relationship({
      ref: 'Contract',
      many: true,
    }),
    teamTwoDraftPicks: relationship({
      ref: 'DraftPick',
      many: true,
    }),
    teamTwoApproves: checkbox(),
    teamsAgree: timestamp(),
    tradeFinalized: checkbox(),
  },
  access: tradeAccess,
});
