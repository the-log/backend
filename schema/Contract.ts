import { list, graphql } from '@keystone-6/core';
import {
  integer,
  select,
  relationship,
  checkbox,
} from '@keystone-6/core/fields';
import { contractAccess } from '../utils/access';
import { contractHooks } from '../utils/hooks';

export const Contract = list({
  fields: {
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
      access: {
        update: ({ session, inputData, item }) => {

          // Admins can always update
          if (session?.data?.isAdmin) return true;

          // Owners can update their own contracts in limited ways
          if (item?.teamId && session?.data?.team?.id === item.teamId) {
            const allowedUpdates = new Map([
              ['active', ['ir', 'waived']],
              ['dts', ['waived', 'active']],
              ['ir', ['waived']],
            ]);

            const allowed = allowedUpdates.get(item.status);
            if (allowed?.includes(inputData.status)) {
              return true;
            }
          }

          // All else fails
          return false;
        }
      }
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
  hooks: contractHooks,
});
