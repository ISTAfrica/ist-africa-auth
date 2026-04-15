'use strict';

/**
 * - Defensively repairs the client_users schema (adds the unique constraint
 *   and indexes if a previous partial migration left them missing).
 * - Backfills client_users from client_app_tokens so existing integrations
 *   keep working when the access check is enabled.
 *
 * Uses NOT EXISTS (rather than ON CONFLICT) so it does not depend on the
 * unique constraint actually being present at execution time.
 */
module.exports = {
  async up(queryInterface) {
    // 1. Ensure the unique constraint exists (idempotent).
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'client_users_clientId_userId_unique'
        ) THEN
          ALTER TABLE client_users
            ADD CONSTRAINT "client_users_clientId_userId_unique"
            UNIQUE ("clientId", "userId");
        END IF;
      END$$;
    `);

    // 2. Ensure helper indexes exist (idempotent).
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS client_users_user_id_idx ON client_users ("userId");
      CREATE INDEX IF NOT EXISTS client_users_client_id_idx ON client_users ("clientId");
    `);

    // 3. Backfill from client_app_tokens (any user who has previously
    //    authenticated against an app gets explicit access to it).
    await queryInterface.sequelize.query(`
      INSERT INTO client_users (id, "clientId", "userId", "createdAt", "updatedAt")
      SELECT
        gen_random_uuid(),
        c.id,
        cat."userId",
        NOW(),
        NOW()
      FROM client_app_tokens cat
      JOIN clients c ON c.client_id = cat."clientId"
      WHERE NOT EXISTS (
        SELECT 1 FROM client_users cu
        WHERE cu."clientId" = c.id AND cu."userId" = cat."userId"
      );
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM client_users
      WHERE ("clientId", "userId") IN (
        SELECT c.id, cat."userId"
        FROM client_app_tokens cat
        JOIN clients c ON c.client_id = cat."clientId"
      );
    `);
  },
};
