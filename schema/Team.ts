import { graphql, list } from '@keystone-6/core';
import {
  text,
  relationship,
  integer,
  float,
  virtual,
} from '@keystone-6/core/fields';
import { teamAccess } from '../utils/access';

export const Team = list({
  fields: {
    espn_id: integer({
      validation: {
        isRequired: true,
      },
      isIndexed: 'unique',
    }),
    name: text(),
    logo: text(),
    abbreviation: text({
      isIndexed: 'unique',
    }),
    projectedRank: integer(),
    playoffSeed: integer(),
    rankCalculatedFinal: integer(),
    wins: integer(),
    losses: integer(),
    ties: integer(),
    pointsFor: float(),
    pointsAgainst: float(),
    percentage: float(),
    gamesBack: float(),
    streakLength: integer(),
    streakType: text(),
    contractTotals: virtual({
      field: graphql.field({
        type: graphql.JSON,
        async resolve(item, _args, context) {
          const contracts = await context.query.Contract.findMany({
            where: {team: { id: { equals: item.id.toString() }}},
            query: 'salary years status'
          });

          return contracts.reduce((prev, curr) => {

            let { salary, years, active, dts, ir, waived } = prev;
            const { status } = curr;

            switch (status) {
              case "active":
                salary += curr.salary;
                years += curr.years;
                active ++;
                break;

              case "dts":
                salary += curr.salary / 10;
                dts++;
                break;

              case "ir":
                salary += curr.salary / 2;
                years += curr.years - 1;
                ir++;
                break;

              case "waived":
                salary += curr.salary / 2;
                years ++
                waived++;
                break;

              default:
                break;
            }

            return {
              salary,
              years,
              active,
              dts,
              ir,
              waived
            }
          }, {
            salary: 0,
            years: 0,
            active: 0,
            dts: 0,
            ir: 0,
            waived: 0,
          });
        }
      })
    }),
    owner: relationship({
      ref: 'User.team',
    }),
    contracts: relationship({
      ref: 'Contract.team',
      many: true,
    }),
  },
  access: teamAccess
});
