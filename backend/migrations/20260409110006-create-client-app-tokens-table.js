'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('client_app_tokens').catch(() => null);
    if (tableExists) return;

    await queryInterface.createTable('client_app_tokens', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      clientId: { type: Sequelize.STRING, allowNull: false },
      hashedClientSecret: { type: Sequelize.STRING, allowNull: false },
      accessToken: { type: Sequelize.TEXT, allowNull: false },
      refreshToken: { type: Sequelize.TEXT, allowNull: false },
      accessTokenIssuedAt: { type: Sequelize.DATE, allowNull: false },
      refreshTokenIssuedAt: { type: Sequelize.DATE, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('client_app_tokens');
  },
};
