'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('blacklisted_tokens').catch(() => null);
    if (tableExists) return;

    await queryInterface.createTable('blacklisted_tokens', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      token: { type: Sequelize.TEXT, allowNull: false, unique: true },
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      deviceInfo: { type: Sequelize.STRING, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('blacklisted_tokens', ['userId']);
    await queryInterface.addIndex('blacklisted_tokens', ['token']);
    await queryInterface.addIndex('blacklisted_tokens', ['expiresAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('blacklisted_tokens');
  },
};
