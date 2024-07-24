import { list } from '@keystone-6/core';
import {
  integer,
  json,
  text,
  select,
  relationship
} from '@keystone-6/core/fields';
import { readOnly } from '../utils/access';
import { Team } from './Team';

export const LeagueSetting = list({
  fields: {
    season: integer(),
    phase: select({
      options: [
        {
          label: "offseason",
          value: "off"
        },
        {
          label: "draft",
          value: "draft"
        },
        {
          label: "rfa",
          value: "rfa"
        },
        {
          label: "active",
          value: "active"
        }
      ]
    }),
    draft_order: json(),
    rfa_order: json(),
    on_the_clock: relationship({
      ref: 'Team'
    }),
    bid_deadlines: json(),
    ft_prices: json(),
  },
  isSingleton: true,
  access: readOnly,
});
