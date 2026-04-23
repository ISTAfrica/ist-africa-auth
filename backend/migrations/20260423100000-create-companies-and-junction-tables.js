'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ── companies ─────────────────────────────────────────
    const companiesExists = await queryInterface
      .describeTable('companies')
      .catch(() => null);

    if (!companiesExists) {
      await queryInterface.createTable('companies', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        name: { type: Sequelize.STRING, allowNull: false, unique: true },
        slug: { type: Sequelize.STRING, allowNull: false, unique: true },
        description: { type: Sequelize.TEXT, allowNull: true },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
      });
    }

    // ── user_companies ────────────────────────────────────
    const userCompaniesExists = await queryInterface
      .describeTable('user_companies')
      .catch(() => null);

    if (!userCompaniesExists) {
      await queryInterface.createTable('user_companies', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        companyId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'companies', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        assignedBy: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
      });

      await queryInterface.addConstraint('user_companies', {
        fields: ['userId', 'companyId'],
        type: 'unique',
        name: 'user_companies_userId_companyId_unique',
      });
      await queryInterface.addIndex('user_companies', ['userId']);
      await queryInterface.addIndex('user_companies', ['companyId']);
    }

    // ── client_companies ──────────────────────────────────
    const clientCompaniesExists = await queryInterface
      .describeTable('client_companies')
      .catch(() => null);

    if (!clientCompaniesExists) {
      await queryInterface.createTable('client_companies', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        clientId: {
          type: Sequelize.STRING,
          allowNull: false,
          references: { model: 'clients', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        companyId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'companies', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
      });

      await queryInterface.addConstraint('client_companies', {
        fields: ['clientId', 'companyId'],
        type: 'unique',
        name: 'client_companies_clientId_companyId_unique',
      });
      await queryInterface.addIndex('client_companies', ['clientId']);
      await queryInterface.addIndex('client_companies', ['companyId']);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('client_companies').catch(() => {});
    await queryInterface.dropTable('user_companies').catch(() => {});
    await queryInterface.dropTable('companies').catch(() => {});
  },
};
