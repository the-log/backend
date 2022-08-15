import { list } from '@keystone-6/core';
import {
  integer,
  select,
  relationship,
  checkbox,
} from '@keystone-6/core/fields';
import { contractAccess } from '../utils/access';

export const Contract = list({
  fields: {
    node_id: integer({
      validation: {
        isRequired: true,
      },
      isIndexed: 'unique',
    }),
    salary: integer({
      validation: {
        isRequired: true,
        min: 100,
        max: 100000,
      },
      isIndexed: true,
    }),
    years: integer({
      validation: {
        isRequired: true,
        min: 0,
        max: 100,
      },
    }),
    status: select({
      isIndexed: true,
      validation: {
        isRequired: true,
      },
      options: [
        { label: 'Active', value: 'active' },
        { label: 'DTS', value: 'dts' },
        { label: 'Waived', value: 'waived' },
        { label: 'Injured Reserve', value: 'ir' },
        { label: 'Restricted Free Agent', value: 'rfa' },
      ],
    }),
    team: relationship({
      ref: 'Team.contracts',
      many: false,
    }),
    player: relationship({
      ref: 'Player.contract',
    }),
    needsAttention: checkbox(),
    isFranchiseTagged: checkbox(),
  },
  access: contractAccess,
});
