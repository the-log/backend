import {
  ListAccessControl,
  BaseListTypeInfo,
  KeystoneContextFromListTypeInfo
} from "@keystone-6/core/types";

interface AccessParameters {
  session: {
    listKey: string;
    itemId: string;
    data: {
      name: string;
      team: {
        id: string;
      }
      isAdmin: boolean;
      isOwner: boolean;
    }
  }
  context: KeystoneContextFromListTypeInfo<BaseListTypeInfo>;
  listKey: string;
  operation: string;
}

const isAuthenticated = ({ session }: AccessParameters) => Boolean(session);
const isOwner = ({ session }: AccessParameters) => (session?.data.isOwner);
const isAdmin = ({ session }: AccessParameters) => (session?.data.isAdmin);

export const bidAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: ({session}) => true,
    create: isOwner,
  }
};

export const contractAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: isAuthenticated,
    create: isAdmin,
    delete: isAdmin,
  }
};

export const draftPickAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: isAuthenticated,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  }
};

export const playerAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: isAuthenticated,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  }
};

export const teamAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: isAuthenticated,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  }
};

export const tradeAccess: ListAccessControl<BaseListTypeInfo> = {};

export const userAccess: ListAccessControl<BaseListTypeInfo> = {
  operation: {
    query: isAuthenticated,
    create: isAdmin,
    delete: isAdmin,
  },
  item: {
    update: ({session, item}) => {
      const isOwnUser = (session?.itemId || false) === item.id;
      const isAdmin = session?.data.isAdmin || false;

      console.log(isOwnUser, isAdmin);


      return (isOwnUser || isAdmin);
    }
  }
}
