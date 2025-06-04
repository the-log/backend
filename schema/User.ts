import { list } from '@keystone-6/core';
import {
  text,
  password,
  relationship,
  checkbox,
} from '@keystone-6/core/fields';

import { userAccess } from '../utils/access';
import { userHooks } from '../utils/hooks';
import { Lists } from '.keystone/types';

export const User: Lists.User = list({
  fields: {
    name: text({ validation: { isRequired: true } }),
    email: text({
      validation: { isRequired: true },
      isIndexed: 'unique',
      isFilterable: true,
    }),
    password: password({
      validation: { isRequired: true },
      access: {
        read: () => false,
      }
    }),
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
  hooks: userHooks
});
