import { ListAccessControl } from "@keystone-6/core/types";

export const readOnly: ListAccessControl<any> = {
  operation: {
    query: ({session}) => true,
    create: ({ session }) => (session?.data.isAdmin),
    update: ({ session }) => (session?.data.isAdmin),
    delete: ({ session }) => (session?.data.isAdmin),
  }
};

export const bidAccess: ListAccessControl<any> = {
  operation: {
    query: ({ session }) => Boolean(session?.data.isOwner),
    create: ({ session }) => Boolean(session?.data.isOwner),
    update: ({ session }) => Boolean(session?.data.isOwner),
    delete: ({ session }) => Boolean(session?.data.isOwner),
  },
  filter: {
    query: ({ session, context }) => {
      const isAdmin = Boolean(session?.data?.isAdmin)
      const fromBackend = (
        context.req?.headers?.origin?.includes('api.log.football') ||
        context.req?.headers?.origin?.includes('api.log.ddev.site')
      )

      // Admins in backend should have full access
      if (isAdmin && fromBackend) {
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

export const contractAccess: ListAccessControl<any> = {
  operation: {
    query: ({ session }) => Boolean(session?.data),
    create: ({ session }) => Boolean(session?.data?.isAdmin),
    update: ({ session }) => Boolean(session?.data?.isOwner || session?.data?.isAdmin),
    delete: ({ session }) => Boolean(session?.data?.isOwner || session?.data?.isAdmin),
  },
  item: {
    update: ({ session, item }) => Boolean(
      session?.data?.isAdmin ||
      item.teamId === session?.data?.team?.id
    ),
    delete: ({ session, item }) => Boolean(
      session?.data?.isAdmin ||
      (item.status === 'dts' && item.teamId === session?.data?.team?.id)
    )
  }
};

export const draftPickAccess: ListAccessControl<any> = {
  operation: {
    query: ({ session }) => Boolean(session?.data),
    create: ({ session }) => Boolean(session?.data?.isAdmin),
    update: ({ session }) => Boolean(session?.data?.isAdmin),
    delete: ({ session }) => Boolean(session?.data?.isAdmin),
  }
};

export const playerAccess: ListAccessControl<any> = {
  operation: {
    query: ({ session }) => Boolean(session?.data),
    create: ({ session }) => Boolean(session?.data?.isAdmin),
    update: ({ session }) => Boolean(session?.data?.isAdmin),
    delete: ({ session }) => Boolean(session?.data?.isAdmin),
  }
};

export const teamAccess: ListAccessControl<any> = {
  operation: {
    query: ({ session }) => Boolean(session?.data),
    create: ({ session }) => Boolean(session?.data?.isAdmin),
    update: ({ session }) => Boolean(session?.data?.isAdmin),
    delete: ({ session }) => Boolean(session?.data?.isAdmin),
  }
};

export const tradeAccess: ListAccessControl<any> = {
  operation: {
    query: ({ session }) => Boolean(session?.data),
    create: ({ session }) => Boolean(session?.data?.isAdmin),
    update: ({ session }) => Boolean(session?.data?.isAdmin),
    delete: ({ session }) => Boolean(session?.data?.isAdmin),
  }
};

export const userAccess: ListAccessControl<any> = {
  operation: {
    query: ({ session }) => Boolean(session?.data),
    create: ({ session }) => Boolean(session?.data?.isAdmin),
    update: ({ session }) => Boolean(session?.data), // Users can update own info
    delete: ({ session }) => Boolean(session?.data?.isAdmin),
  },
  item: {
    update: ({session, item}) => {
      const isOwnUser = (session?.itemId === item.id);
      const isAdmin = Boolean(session?.data?.isAdmin);
      return (isOwnUser || isAdmin);
    }
  }
}
