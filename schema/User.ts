import { list } from '@keystone-6/core';
import {
  text,
  password,
  relationship,
  checkbox,
} from '@keystone-6/core/fields';

import { userAccess } from '../utils/access';

export const User = list({
  fields: {
    name: text({ validation: { isRequired: true } }),
    email: text({
      validation: { isRequired: true },
      isIndexed: 'unique',
      isFilterable: true,
    }),
    password: password({ validation: { isRequired: true } }),
    team: relationship({
      ref: 'Team.owner',
    }),
    isAdmin: checkbox({
      label: 'Is Admin',
      defaultValue: false,
    }),
    isOwner: checkbox({
      label: 'Is Team Owner',
      defaultValue: true,
    }),
  },
  access: userAccess,
  hooks: {
    resolveInput: async ({ resolvedData, context }) => {
      // If making first user, make them an admin.
      const count = await context.query.User.count();
      if (count === 0) {
        resolvedData.isAdmin = true;
      }
      return resolvedData;
    }
  }
});
