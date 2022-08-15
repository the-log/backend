import { list } from '@keystone-6/core';
import {
  relationship,
  integer,
  checkbox,
} from '@keystone-6/core/fields';
import { bidAccess } from '../utils/access';

export const Bid = list({
  fields: {
    team: relationship({
      ref: 'Team',
    }),
    player: relationship({
      ref: 'Player',
    }),
    salary: integer({
      validation: {
        isRequired: true,
        min: 100,
        max: 10000,
      },
    }),
    years: integer({
      validation: {
        isRequired: true,
        min: 0,
        max: 100,
      },
    }),
    is_dts: checkbox(),
    is_locked: checkbox({
      defaultValue: false,
    }),
  },
  access: bidAccess,
});
