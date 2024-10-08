import { getContext } from '@keystone-6/core/context';
import config from '../../keystone';
import * as PrismaModule from '@prisma/client'

const { db, query } = getContext(config, PrismaModule).sudo();

(async () => {

  const {bid_deadlines} = await db.LeagueSetting.findOne({where:{id:1}});
  const now = Date.now();
  const past = bid_deadlines.filter(ts => ts <= now);
  const future = bid_deadlines.filter(ts => ts > now);

  if (past.length) {
    const bids = await getOpenBids();

    let evalOrder = 0;
    for (const bidGroup of bids.entries()) {
      evalOrder++
      const [playerID, bids] = bidGroup;

      // Sort bids (salary, length, record, points-for).
      bids
        .sort((a, b) => (a.team.pointsFor - b.team.pointsFor))
        .sort((a, b) => (a.team.percentage - b.team.percentage))
        .sort((a, b) => (b.years - a.years))
        .sort((a, b) => (b.salary - a.salary))

      // Validate bids against cap values.
      const valid = [];
      const invalid = [];
      for (const bid of bids) {
        const {
          salary,
          years,
          team: {
            id: teamId
          }
        } = bid;

        // Get cap space info
        const {contractTotals} = await query.Team.findOne({
          where: {
            id: teamId
          },
          query: "contractTotals",
        });

        if (
          years + contractTotals.years > 100 ||
          salary + contractTotals.salary > 100000 ||
          contractTotals.active >= 40
        ) {
          invalid.push(bid)
        } else {
          valid.push(bid)
        }
      }

      if (valid.length) {
        const winner = valid[0];

        // Search for contracts on the won player
        const player = await query.Player.findOne({
          where: {
            id: playerID
          },
          query: "contract {id}",
        });

        // Delete waived contract
        if (player?.contract?.id) {
          db.Contract.deleteOne({
            where: {
              id: player.contract.id
            }
          })
        }

        await db.Contract.createOne({
          data: {
            salary: winner.salary,
            years: winner.years,
            status: 'active',
            team: {
              connect: {
                id: winner.teamId
              }
            },
            player: {
              connect: {
                id: winner.playerId
              }
            }
          }
        });
      }

      let bidOrder = 0;
      for (const bid of [...valid, ...invalid]) {
        bidOrder++;

        await db.Bid.updateOne({
          where: {
            id: bid.id
          },
          data: {
            years: bid.years,
            bid_order: bidOrder,
            eval_order: evalOrder,
          }
        })
      }
    }

    await db.LeagueSetting.updateOne({
      where: {
        id:1
      },
      data: {
        bid_deadlines: future
      }
    });
  }

})()

async function getOpenBids() {
  // Fetch bids from DB
  const bids = await db.Bid.findMany({
    where: {
      locked: {
        equals: null
      }
    }
  });

  const teams = await query.Team.findMany({
    query: "id percentage pointsFor pointsAgainst",
  });

  // Sort bids by salary so higher values are processed first.
  bids.sort((a, b) => (b.salary - a.salary))

  // Lock fetched bids
  const lockTime = (new Date()).toISOString()
  await db.Bid.updateMany({
    data: bids.map(bid => ({
      where: {
        id: bid.id
      },
      data: {
        locked: lockTime
      }
    }))
  })

  const grouped = new Map();

  for (const bid of bids) {
    // Add team data for sorting later.
    bid.team = teams.find((team) => (team.id === bid.teamId));

    // Enforce $5 limit.
    if (bid.salary < 500) {
      bid.years = 1;
    }

    // Group bids by player
    const player = bid.playerId;
    if (!grouped.has(player)) {
      grouped.set(player, [])
    }
    const existing = grouped.get(player);
    grouped.set(player, [...existing, bid])
  }

  return grouped;
}
