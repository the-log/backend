import { list } from '@keystone-6/core';
import {
  timestamp,
} from '@keystone-6/core/fields';
import { readOnly } from '../utils/access';

export const FreeAgencyCalendar = list({
  fields: {
    preseason: timestamp({
      label: 'Preseason'
    }),
    week1: timestamp({
      label: 'Week 1'
    }),
    week2: timestamp({
      label: 'Week 2'
    }),
    week3: timestamp({
      label: 'Week 3'
    }),
    week4: timestamp({
      label: 'Week 4'
    }),
    week5: timestamp({
      label: 'Week 5'
    }),
    week6: timestamp({
      label: 'Week 6'
    }),
    week7: timestamp({
      label: 'Week 7'
    }),
    week8: timestamp({
      label: 'Week 8'
    }),
    week9: timestamp({
      label: 'Week 9'
    }),
    week10: timestamp({
      label: 'Week 10'
    }),
    week11: timestamp({
      label: 'Week 11'
    }),
    week12: timestamp({
      label: 'Week 12'
    }),
    week13: timestamp({
      label: 'Week 13'
    }),
    week14: timestamp({
      label: 'Week 14'
    }),
    week15: timestamp({
      label: 'Week 15'
    }),
    week16: timestamp({
      label: 'Week 16'
    }),
    week17: timestamp({
      label: 'Week 17'
    }),
  },
  isSingleton: true,
  access: readOnly,
});
