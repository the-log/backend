import { list } from '@keystone-6/core';
import {
  integer,
  json,
  text,
} from '@keystone-6/core/fields';
import { readOnly } from '../utils/access';

export const LeagueSetting = list({
  fields: {
    season: integer(),
    phase: text(),
    bid_deadlines: json(),
  },
  isSingleton: true,
  access: readOnly,
});
