'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('client_users').catch(() => null);
    if (tableExists) return;

    await queryInterface.createTable('client_users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      clientId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
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
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addConstraint('client_users', {
      fields: ['clientId', 'userId'],
      type: 'unique',
      name: 'client_users_clientId_userId_unique',
    });

    await queryInterface.addIndex('client_users', ['userId']);
    await queryInterface.addIndex('client_users', ['clientId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('client_users');
  },
};
