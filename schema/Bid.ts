import { list } from '@keystone-6/core';
import { Lists } from '.keystone/types';
import {
  relationship,
  integer,
  checkbox,
  timestamp,
} from '@keystone-6/core/fields';
import { bidAccess } from '../utils/access';

export const Bid: Lists.Bid = list({
  fields: {
    created: timestamp({
      defaultValue: {kind: 'now'}
    }),
    locked: timestamp(),
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
        max: 100000,
      },
    }),
    years: integer({
      validation: {
        isRequired: true,
        min: 0,
        max: 100,
      },
    }),
    bid_order: integer(),
    eval_order: integer(),
    is_dts: checkbox(),
  },
  access: bidAccess,
});
