// Debug Prisma connections
import * as PrismaModule from '@prisma/client';

// Keep track of original methods
const originalConnect = PrismaModule.PrismaClient.prototype.$connect;
const originalDisconnect = PrismaModule.PrismaClient.prototype.$disconnect;

// Override connect to log connection details
PrismaModule.PrismaClient.prototype.$connect = async function() {
  try {
    // Extract and log connection info while masking sensitive parts
    const url = (this as any)._engineConfig?.datasources?.db?.url || 'unknown';
    const maskedUrl = url.replace(/:[^:@]+@/, ':***@');
    
    console.log(`[DB-DEBUG] Attempting database connection with URL: ${maskedUrl}`);
    
    // Try to extract username from connection string
    let username = 'unknown';
    try {
      // postgres://username:password@hostname:port/database
      const match = url.match(/postgres:\/\/([^:]+):/);
      if (match && match[1]) {
        username = match[1];
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    console.log(`[DB-DEBUG] Connection username: ${username}`);
    
    // Call original method
    return await originalConnect.apply(this, arguments as unknown as []);
  } catch (error) {
    console.error(`[DB-DEBUG] Connection error: ${error}`);
    throw error;
  }
};

// Override disconnect to log when connections are closed
PrismaModule.PrismaClient.prototype.$disconnect = async function() {
  console.log(`[DB-DEBUG] Closing database connection`);
  return await originalDisconnect.apply(this, arguments as unknown as []);
};

console.log('[DB-DEBUG] Database connection monitoring installed');
