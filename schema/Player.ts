import { list, graphql } from '@keystone-6/core';
import {
  text,
  relationship,
  integer,
  float,
  checkbox,
  json,
} from '@keystone-6/core/fields';
import { playerAccess } from '../utils/access';

export const Player = list({
  fields: {
    espn_id: integer({
      isIndexed: 'unique',
      validation: {
        isRequired: true,
      },
    }),
    name: text({
      isIndexed: true,
      validation: {
        isRequired: true,
      },
    }),
    age: integer(),
    height: float(),
    weight: float(),
    debutYear: integer(),
    draftYear: integer(),
    draftRound: integer(),
    draftSelection: integer(),
    team: text(),
    position: text({
      isIndexed: true,
    }),
    positionWeight: integer(),
    isIrEligible: checkbox(),
    injuryStatus: text({
      isIndexed: true,
    }),
    positionRank: integer(),
    overallRank: integer(),
    positionRankProj: integer(),
    overallRankProj: integer(),
    seasonOutlook: text({
      db: process.env.DATABASE_TYPE === 'postgresql' ? { nativeType: 'Text' } : undefined,
    }),
    outlooksByWeek: json(),
    isRookie: checkbox(),
    fullStats: json(),
    pointsLastYear: float({
      isIndexed: true,
    }),
    pointsThisYear: float({
      isIndexed: true,
    }),
    pointsThisYearProj: float({
      isIndexed: true,
    }),
    pointsThisWeekProj: float({
      isIndexed: true,
    }),
    splits: json(),
    contract: relationship({
      ref: 'Contract.player'
    }),
  },
  access: playerAccess,
});
