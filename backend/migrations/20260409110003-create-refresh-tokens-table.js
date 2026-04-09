'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('refresh_tokens').catch(() => null);
    if (tableExists) return;

    await queryInterface.createTable('refresh_tokens', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      hashedToken: { type: Sequelize.STRING, allowNull: false, unique: true },
      userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      revoked: { type: Sequelize.BOOLEAN, defaultValue: false },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      browser: { type: Sequelize.STRING, allowNull: true },
      os: { type: Sequelize.STRING, allowNull: true },
      deviceType: { type: Sequelize.STRING, allowNull: true },
      ipAddress: { type: Sequelize.STRING, allowNull: true },
      lastActiveAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('refresh_tokens', ['userId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('refresh_tokens');
  },
};
