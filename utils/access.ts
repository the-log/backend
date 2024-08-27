import {
  ListAccessControl,
  BaseListTypeInfo,
} from "@keystone-6/core/types";

export const readOnly: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: ({session}) => true,
    create: ({ session }) => (session?.data.isAdmin),
    update: ({ session }) => (session?.data.isAdmin),
    delete: ({ session }) => (session?.data.isAdmin),
  }
};

export const bidAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: ({ session }) => Boolean(session?.data.isOwner),
    create: ({ session }) => Boolean(session?.data.isOwner),
    update: ({ session }) => Boolean(session?.data.isOwner),
    delete: ({ session }) => Boolean(session?.data.isOwner),
  },
  filter: {
    query: ({ session, context }) => {
      const isAdmin = Boolean(session?.data?.isAdmin)
      const fromClient = (
        context.req?.headers?.origin?.includes('log.football') ||
        context.req?.headers?.origin?.includes('app.log.ddev.site')
      )

      // Admins in backend should have full access
      if (isAdmin && !fromClient) {
        return {}
      }

      // Filter client-side results to locked & own prepublish
      return {
        OR: [
          {
            team: {
              id: {
                equals: session?.data?.team?.id
              }
            }
          },
          {
            locked: {
              not: null
            }
          }
        ]
      };
    }
  },
  item: {
    update: ({ session, item }) => {
      const isOwnBid = session?.data?.team?.id === item?.teamId
      const isLocked = Boolean(item?.locked)

      return !isLocked && isOwnBid;
    },
    delete: ({ session, item }) => {
      const isOwnBid = session?.data?.team?.id === item?.teamId
      const isLocked = Boolean(item?.locked)

      return !isLocked && isOwnBid;
    }
  }
};

export const contractAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: ({ session }) => Boolean(session),
    create: ({ session }) => (session?.data.isAdmin),
    update: ({ session }) => (session?.data.isOwner),
    delete: ({ session }) => (session?.data.isOwner),
  },
  item: {
    update: ({ session, item }) => (
      session.data.isAdmin ||
      item.teamId === session.data.team.id
    ),
    delete: ({ session, item }) => (
      session.data.isAdmin ||
      (item.status === 'dts' && item.teamId === session.data.team.id)
    )
  }
};

export const draftPickAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: ({ session }) => Boolean(session),
    create: ({ session }) => (session?.data.isAdmin),
    update: ({ session }) => (session?.data.isAdmin),
    delete: ({ session }) => (session?.data.isAdmin),
  }
};

export const playerAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: ({ session }) => Boolean(session),
    create: ({ session }) => (session?.data.isAdmin),
    update: ({ session }) => (session?.data.isAdmin),
    delete: ({ session }) => (session?.data.isAdmin),
  }
};

export const teamAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: ({ session }) => Boolean(session),
    create: ({ session }) => (session?.data.isAdmin),
    update: ({ session }) => (session?.data.isAdmin),
    delete: ({ session }) => (session?.data.isAdmin),
  }
};

export const tradeAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: ({ session }) => Boolean(session),
    create: ({ session }) => Boolean(session),
    update: ({ session }) => Boolean(session),
    delete: ({ session }) => Boolean(session),
  }
};

export const userAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: ({ session }) => Boolean(session),
    create: ({ session }) => (session?.data.isAdmin),
    update: ({ session }) => (session?.data.isAdmin),
    delete: ({ session }) => (session?.data.isAdmin),
  },
  item: {
    update: ({session, item}) => {
      const isOwnUser = (session?.itemId || false) === item.id;
      const isAdmin = session?.data.isAdmin || false;
      return (isOwnUser || isAdmin);
    }
  }
}
