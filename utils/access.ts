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
    query: ({session}) => true,
    create: ({ session }) => (session?.data.isOwner),
    update: ({ session }) => (session?.data.isOwner),
    delete: ({ session }) => (session?.data.isOwner),
  }
};

export const contractAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: ({ session }) => Boolean(session),
    create: ({ session }) => (session?.data.isAdmin),
    update: ({ session }) => (session?.data.isAdmin),
    delete: ({ session }) => (session?.data.isAdmin),
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
