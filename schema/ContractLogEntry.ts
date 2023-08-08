import { list } from '@keystone-6/core';
import {
  text,
  relationship,
  timestamp,
  json
} from '@keystone-6/core/fields';
import { contractAccess } from '../utils/access';

export const ContractLogEntry = list({
  fields: {
    created: timestamp({
      defaultValue: {kind: 'now'},
    }),
    contract: relationship({
      ref: 'Contract',
    }),
    player: relationship({
      ref: 'Player',
    }),
    team: relationship({
      ref: 'Team',
    }),
    user: relationship({
      ref: 'User',
    }),
    message: text({}),
    oldValues: json({}),
    newValues: json({}),
  },
  access: contractAccess,
  ui: {
    isHidden: false,
  },
});
