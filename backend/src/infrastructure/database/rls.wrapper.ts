/**
 * Row-Level Security (RLS) Wrapper
 * Provides PostgreSQL RLS context for user-scoped queries
 */

import PrismaService from './prisma.service';

class RLSWrapper {
  private prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  /**
   * Execute database operations with RLS user context
   * Sets app.current_user_id for PostgreSQL RLS policies
   * 
   * @param userId - The user ID to set in RLS context
   * @param callback - Function containing database operations
   * @returns Result of the callback function
   * 
   * @example
   * const elections = await rls.withUserContext(userId, async (prisma) => {
   *   return await prisma.election.findMany();
   * });
   */
  async withUserContext<T>(
    userId: string,
    callback: (prisma: PrismaService) => Promise<T>
  ): Promise<T> {
    return await this.prisma.$transaction(async (tx) => {
      // Set RLS context for this transaction
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
      
      // Execute callback with transaction context
      return await callback(tx as PrismaService);
    });
  }

  /**
   * Execute operations without RLS context (admin/system operations)
   * Use with caution - bypasses row-level security
   * 
   * @param callback - Function containing database operations
   * @returns Result of the callback function
   */
  async withoutContext<T>(
    callback: (prisma: PrismaService) => Promise<T>
  ): Promise<T> {
    return await callback(this.prisma);
  }
}

export default RLSWrapper;
