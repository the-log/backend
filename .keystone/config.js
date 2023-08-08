"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// keystone.ts
var keystone_exports = {};
__export(keystone_exports, {
  default: () => keystone_default
});
module.exports = __toCommonJS(keystone_exports);
var import_config = require("dotenv/config");
var import_core10 = require("@keystone-6/core");

// schema/Bid.ts
var import_core = require("@keystone-6/core");
var import_fields = require("@keystone-6/core/fields");

// utils/access.ts
var readOnly = {
  operation: {
    query: ({ session: session2 }) => true,
    create: ({ session: session2 }) => session2?.data.isAdmin,
    update: ({ session: session2 }) => session2?.data.isAdmin,
    delete: ({ session: session2 }) => session2?.data.isAdmin
  }
};
var bidAccess = {
  operation: {
    query: ({ session: session2 }) => true,
    create: ({ session: session2 }) => session2?.data.isOwner,
    update: ({ session: session2 }) => session2?.data.isOwner,
    delete: ({ session: session2 }) => session2?.data.isOwner
  }
};
var contractAccess = {
  operation: {
    query: ({ session: session2 }) => Boolean(session2),
    create: ({ session: session2 }) => session2?.data.isAdmin,
    update: ({ session: session2 }) => session2?.data.isAdmin,
    delete: ({ session: session2 }) => session2?.data.isAdmin
  }
};
var draftPickAccess = {
  operation: {
    query: ({ session: session2 }) => Boolean(session2),
    create: ({ session: session2 }) => session2?.data.isAdmin,
    update: ({ session: session2 }) => session2?.data.isAdmin,
    delete: ({ session: session2 }) => session2?.data.isAdmin
  }
};
var playerAccess = {
  operation: {
    query: ({ session: session2 }) => Boolean(session2),
    create: ({ session: session2 }) => session2?.data.isAdmin,
    update: ({ session: session2 }) => session2?.data.isAdmin,
    delete: ({ session: session2 }) => session2?.data.isAdmin
  }
};
var teamAccess = {
  operation: {
    query: ({ session: session2 }) => Boolean(session2),
    create: ({ session: session2 }) => session2?.data.isAdmin,
    update: ({ session: session2 }) => session2?.data.isAdmin,
    delete: ({ session: session2 }) => session2?.data.isAdmin
  }
};
var tradeAccess = {
  operation: {
    query: ({ session: session2 }) => Boolean(session2),
    create: ({ session: session2 }) => Boolean(session2),
    update: ({ session: session2 }) => Boolean(session2),
    delete: ({ session: session2 }) => Boolean(session2)
  }
};
var userAccess = {
  operation: {
    query: ({ session: session2 }) => Boolean(session2),
    create: ({ session: session2 }) => session2?.data.isAdmin,
    update: ({ session: session2 }) => session2?.data.isAdmin,
    delete: ({ session: session2 }) => session2?.data.isAdmin
  },
  item: {
    update: ({ session: session2, item }) => {
      const isOwnUser = (session2?.itemId || false) === item.id;
      const isAdmin = session2?.data.isAdmin || false;
      return isOwnUser || isAdmin;
    }
  }
};

// schema/Bid.ts
var Bid = (0, import_core.list)({
  fields: {
    created: (0, import_fields.timestamp)({
      defaultValue: { kind: "now" }
    }),
    team: (0, import_fields.relationship)({
      ref: "Team"
    }),
    player: (0, import_fields.relationship)({
      ref: "Player"
    }),
    salary: (0, import_fields.integer)({
      validation: {
        isRequired: true,
        min: 100,
        max: 1e4
      }
    }),
    years: (0, import_fields.integer)({
      validation: {
        isRequired: true,
        min: 0,
        max: 100
      }
    }),
    is_dts: (0, import_fields.checkbox)(),
    is_locked: (0, import_fields.checkbox)({
      defaultValue: false
    })
  },
  access: bidAccess
});

// schema/Contract.ts
var import_core2 = require("@keystone-6/core");
var import_fields2 = require("@keystone-6/core/fields");

// utils/hooks.ts
var getLogMessage = (oldContract, newContract) => {
  if (!oldContract)
    return "New Contract";
  if (!newContract)
    return "Contract Terminated";
  if (oldContract.status !== newContract.status) {
    const statusLabels = {
      active: "Active Roster",
      dts: "DTS",
      waived: "Waivers",
      ir: "Injured Reserve",
      rfa: "Restricted Free Agent"
    };
    return `To ${statusLabels[newContract.status]}`;
  }
  return "See Details";
};
var contractHooks = {
  afterOperation: ({ operation, originalItem, item, context }) => {
    const message = getLogMessage(
      originalItem,
      item
    );
    const source = operation === "create" ? item : originalItem;
    const contract = operation === "delete" ? null : {
      connect: {
        id: source.id
      }
    };
    const data = {
      contract,
      player: { connect: { id: source.playerId } },
      team: { connect: { id: source.teamId } },
      user: { connect: { id: context.session.itemId } },
      message,
      oldValues: originalItem,
      newValues: item
    };
    console.log(JSON.stringify(data, null, 2));
    context.query.ContractLogEntry.createOne({
      data
    });
  }
};

// schema/Contract.ts
var Contract = (0, import_core2.list)({
  fields: {
    node_id: (0, import_fields2.integer)({
      validation: {
        isRequired: true
      },
      isIndexed: "unique"
    }),
    salary: (0, import_fields2.integer)({
      validation: {
        isRequired: true,
        min: 100,
        max: 1e5
      },
      isIndexed: true
    }),
    years: (0, import_fields2.integer)({
      validation: {
        isRequired: true,
        min: 0,
        max: 100
      }
    }),
    status: (0, import_fields2.select)({
      isIndexed: true,
      validation: {
        isRequired: true
      },
      options: [
        { label: "Active", value: "active" },
        { label: "DTS", value: "dts" },
        { label: "Waived", value: "waived" },
        { label: "Injured Reserve", value: "ir" },
        { label: "Restricted Free Agent", value: "rfa" }
      ]
    }),
    team: (0, import_fields2.relationship)({
      ref: "Team.contracts",
      many: false
    }),
    player: (0, import_fields2.relationship)({
      ref: "Player.contract"
    }),
    needsAttention: (0, import_fields2.checkbox)(),
    isFranchiseTagged: (0, import_fields2.checkbox)()
  },
  access: contractAccess,
  hooks: contractHooks
});

// schema/ContractLogEntry.ts
var import_core3 = require("@keystone-6/core");
var import_fields3 = require("@keystone-6/core/fields");
var ContractLogEntry = (0, import_core3.list)({
  fields: {
    created: (0, import_fields3.timestamp)({
      defaultValue: { kind: "now" }
    }),
    contract: (0, import_fields3.relationship)({
      ref: "Contract"
    }),
    player: (0, import_fields3.relationship)({
      ref: "Player"
    }),
    team: (0, import_fields3.relationship)({
      ref: "Team"
    }),
    user: (0, import_fields3.relationship)({
      ref: "User"
    }),
    message: (0, import_fields3.text)({}),
    oldValues: (0, import_fields3.json)({}),
    newValues: (0, import_fields3.json)({})
  },
  access: contractAccess,
  ui: {
    isHidden: false
  }
});

// schema/DraftPick.ts
var import_core4 = require("@keystone-6/core");
var import_fields4 = require("@keystone-6/core/fields");
var DraftPick = (0, import_core4.list)({
  fields: {
    year: (0, import_fields4.integer)({
      validation: {
        isRequired: true,
        min: 2020
      }
    }),
    round: (0, import_fields4.integer)({
      validation: {
        isRequired: true,
        min: 1,
        max: 4
      }
    }),
    team: (0, import_fields4.relationship)({
      ref: "Team",
      many: false
    }),
    owner: (0, import_fields4.relationship)({
      ref: "Team",
      many: false
    }),
    player: (0, import_fields4.relationship)({
      ref: "Player"
    })
  },
  access: draftPickAccess
});

// schema/Player.ts
var import_core5 = require("@keystone-6/core");
var import_fields5 = require("@keystone-6/core/fields");
var Player = (0, import_core5.list)({
  fields: {
    espn_id: (0, import_fields5.integer)({
      isIndexed: "unique",
      validation: {
        isRequired: true
      }
    }),
    name: (0, import_fields5.text)({
      isIndexed: true,
      validation: {
        isRequired: true
      }
    }),
    age: (0, import_fields5.integer)(),
    height: (0, import_fields5.float)(),
    weight: (0, import_fields5.float)(),
    debutYear: (0, import_fields5.integer)(),
    draftYear: (0, import_fields5.integer)(),
    draftRound: (0, import_fields5.integer)(),
    draftSelection: (0, import_fields5.integer)(),
    team: (0, import_fields5.text)(),
    position: (0, import_fields5.text)({
      isIndexed: true
    }),
    positionWeight: (0, import_fields5.integer)(),
    isIrEligible: (0, import_fields5.checkbox)(),
    injuryStatus: (0, import_fields5.text)({
      isIndexed: true
    }),
    positionRank: (0, import_fields5.integer)(),
    overallRank: (0, import_fields5.integer)(),
    seasonOutlook: (0, import_fields5.text)(),
    outlooksByWeek: (0, import_fields5.json)(),
    isRookie: (0, import_fields5.checkbox)(),
    fullStats: (0, import_fields5.json)(),
    pointsLastYear: (0, import_fields5.float)({
      isIndexed: true
    }),
    pointsThisYear: (0, import_fields5.float)({
      isIndexed: true
    }),
    pointsThisYearProj: (0, import_fields5.float)({
      isIndexed: true
    }),
    pointsThisWeekProj: (0, import_fields5.float)({
      isIndexed: true
    }),
    splits: (0, import_fields5.json)(),
    contract: (0, import_fields5.relationship)({
      ref: "Contract.player"
    })
  },
  access: playerAccess
});

// schema/Team.ts
var import_core6 = require("@keystone-6/core");
var import_fields6 = require("@keystone-6/core/fields");
var Team = (0, import_core6.list)({
  fields: {
    espn_id: (0, import_fields6.integer)({
      validation: {
        isRequired: true
      },
      isIndexed: "unique"
    }),
    name: (0, import_fields6.text)(),
    logo: (0, import_fields6.text)(),
    abbreviation: (0, import_fields6.text)({
      isIndexed: "unique"
    }),
    projectedRank: (0, import_fields6.integer)(),
    playoffSeed: (0, import_fields6.integer)(),
    wins: (0, import_fields6.integer)(),
    losses: (0, import_fields6.integer)(),
    ties: (0, import_fields6.integer)(),
    pointsFor: (0, import_fields6.float)(),
    pointsAgainst: (0, import_fields6.float)(),
    percentage: (0, import_fields6.float)(),
    gamesBack: (0, import_fields6.float)(),
    streakLength: (0, import_fields6.integer)(),
    streakType: (0, import_fields6.text)(),
    contractTotals: (0, import_fields6.virtual)({
      field: import_core6.graphql.field({
        type: import_core6.graphql.JSON,
        async resolve(item, _args, context) {
          const contracts = await context.query.Contract.findMany({
            where: { team: { id: { equals: item.id.toString() } } },
            query: "salary years status"
          });
          return contracts.reduce((prev, curr) => {
            let { salary, years, active, dts, ir, waived } = prev;
            const { status } = curr;
            switch (status) {
              case "active":
                salary += curr.salary;
                years += curr.years;
                active++;
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
                years++;
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
            };
          }, {
            salary: 0,
            years: 0,
            active: 0,
            dts: 0,
            ir: 0,
            waived: 0
          });
        }
      })
    }),
    owner: (0, import_fields6.relationship)({
      ref: "User.team"
    }),
    contracts: (0, import_fields6.relationship)({
      ref: "Contract.team",
      many: true
    })
  },
  access: teamAccess
});

// schema/Trade.ts
var import_core7 = require("@keystone-6/core");
var import_fields7 = require("@keystone-6/core/fields");
var Trade = (0, import_core7.list)({
  fields: {
    teamOne: (0, import_fields7.relationship)({
      ref: "Team",
      many: false
    }),
    teamOneContracts: (0, import_fields7.relationship)({
      ref: "Contract",
      many: true
    }),
    teamOneDraftPicks: (0, import_fields7.relationship)({
      ref: "DraftPick",
      many: true
    }),
    teamOneApproves: (0, import_fields7.checkbox)(),
    teamTwo: (0, import_fields7.relationship)({
      ref: "Team",
      many: false
    }),
    teamTwoContracts: (0, import_fields7.relationship)({
      ref: "Contract",
      many: true
    }),
    teamTwoDraftPicks: (0, import_fields7.relationship)({
      ref: "DraftPick",
      many: true
    }),
    teamTwoApproves: (0, import_fields7.checkbox)(),
    teamsAgree: (0, import_fields7.timestamp)(),
    tradeFinalized: (0, import_fields7.checkbox)()
  },
  access: tradeAccess
});

// schema/User.ts
var import_core8 = require("@keystone-6/core");
var import_fields8 = require("@keystone-6/core/fields");
var User = (0, import_core8.list)({
  fields: {
    name: (0, import_fields8.text)({ validation: { isRequired: true } }),
    email: (0, import_fields8.text)({
      validation: { isRequired: true },
      isIndexed: "unique",
      isFilterable: true
    }),
    password: (0, import_fields8.password)({ validation: { isRequired: true } }),
    team: (0, import_fields8.relationship)({
      ref: "Team.owner"
    }),
    isAdmin: (0, import_fields8.checkbox)({
      label: "Is Admin",
      defaultValue: false
    }),
    isOwner: (0, import_fields8.checkbox)({
      label: "Is Team Owner",
      defaultValue: true
    })
  },
  access: userAccess
});

// schema/FreeAgencyCalendar.ts
var import_core9 = require("@keystone-6/core");
var import_fields9 = require("@keystone-6/core/fields");
var FreeAgencyCalendar = (0, import_core9.list)({
  fields: {
    preseason: (0, import_fields9.timestamp)({
      label: "Preseason"
    }),
    week1: (0, import_fields9.timestamp)({
      label: "Week 1"
    }),
    week2: (0, import_fields9.timestamp)({
      label: "Week 2"
    }),
    week3: (0, import_fields9.timestamp)({
      label: "Week 3"
    }),
    week4: (0, import_fields9.timestamp)({
      label: "Week 4"
    }),
    week5: (0, import_fields9.timestamp)({
      label: "Week 5"
    }),
    week6: (0, import_fields9.timestamp)({
      label: "Week 6"
    }),
    week7: (0, import_fields9.timestamp)({
      label: "Week 7"
    }),
    week8: (0, import_fields9.timestamp)({
      label: "Week 8"
    }),
    week9: (0, import_fields9.timestamp)({
      label: "Week 9"
    }),
    week10: (0, import_fields9.timestamp)({
      label: "Week 10"
    }),
    week11: (0, import_fields9.timestamp)({
      label: "Week 11"
    }),
    week12: (0, import_fields9.timestamp)({
      label: "Week 12"
    }),
    week13: (0, import_fields9.timestamp)({
      label: "Week 13"
    }),
    week14: (0, import_fields9.timestamp)({
      label: "Week 14"
    }),
    week15: (0, import_fields9.timestamp)({
      label: "Week 15"
    }),
    week16: (0, import_fields9.timestamp)({
      label: "Week 16"
    }),
    week17: (0, import_fields9.timestamp)({
      label: "Week 17"
    })
  },
  isSingleton: true,
  access: readOnly
});

// schema.ts
var lists = {
  Bid,
  Contract,
  ContractLogEntry,
  DraftPick,
  Player,
  Team,
  Trade,
  User,
  FreeAgencyCalendar
};

// auth.ts
var import_auth = require("@keystone-6/auth");
var import_session = require("@keystone-6/core/session");
var sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "The SESSION_SECRET environment variable must be set in production"
    );
  } else {
    sessionSecret = "-- DEV COOKIE SECRET; CHANGE ME --";
  }
}
var { withAuth } = (0, import_auth.createAuth)({
  listKey: "User",
  identityField: "email",
  sessionData: "name team { id } isAdmin isOwner",
  secretField: "password",
  initFirstItem: {
    // If there are no items in the database, keystone will ask you to create
    // a new user, filling in these fields.
    fields: ["name", "email", "password"]
  }
});
var sessionMaxAge = 60 * 60 * 24 * 30;
var session = (0, import_session.statelessSessions)({
  maxAge: sessionMaxAge,
  secret: sessionSecret,
  sameSite: "none",
  secure: true
});

// keystone.ts
var {
  COOKIE_SECRET: sessionSecret2,
  DATABASE_TYPE: dbType,
  DATABASE_URL: dbUrl
} = process.env;
var keystone_default = withAuth(
  // Using the config function helps typescript guide you to the available options.
  (0, import_core10.config)({
    // the db sets the database provider - we're using sqlite for the fastest startup experience
    db: {
      provider: dbType,
      url: dbUrl
    },
    // This config allows us to set up features of the Admin UI https://keystonejs.com/docs/apis/config#ui
    ui: {
      // For our starter, we check that someone has session data before letting them see the Admin UI.
      isAccessAllowed: (context) => !!context.session?.data
    },
    lists,
    session,
    server: {
      cors: {
        origin: [
          "http://localhost:7777",
          "http://app.log.football",
          "https://app.log.football",
          "http://log.football",
          "https://log.football"
        ],
        credentials: true
      }
    },
    graphql: {
      playground: true
    }
  })
);
