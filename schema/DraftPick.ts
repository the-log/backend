import { list } from '@keystone-6/core';
import { integer, relationship } from '@keystone-6/core/fields';
import { draftPickAccess } from '../utils/access';

export const DraftPick = list({
  fields: {
    year: integer({
      validation: {
        isRequired: true,
        min: 2020,
      },
    }),
    round: integer({
      validation: {
        isRequired: true,
        min: 1,
        max: 4,
      },
    }),
    team: relationship({
      ref: 'Team',
      many: false,
    }),
    owner: relationship({
      ref: 'Team',
      many: false,
    }),
    player: relationship({
      ref: 'Player',
    }),
  },
  access: draftPickAccess,
});
