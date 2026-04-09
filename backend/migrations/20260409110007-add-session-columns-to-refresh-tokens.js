'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('refresh_tokens');

    if (!columns.browser) {
      await queryInterface.addColumn('refresh_tokens', 'browser', { type: Sequelize.STRING, allowNull: true });
    }
    if (!columns.os) {
      await queryInterface.addColumn('refresh_tokens', 'os', { type: Sequelize.STRING, allowNull: true });
    }
    if (!columns.deviceType) {
      await queryInterface.addColumn('refresh_tokens', 'deviceType', { type: Sequelize.STRING, allowNull: true });
    }
    if (!columns.ipAddress) {
      await queryInterface.addColumn('refresh_tokens', 'ipAddress', { type: Sequelize.STRING, allowNull: true });
    }
    if (!columns.lastActiveAt) {
      await queryInterface.addColumn('refresh_tokens', 'lastActiveAt', { type: Sequelize.DATE, allowNull: true });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('refresh_tokens', 'browser');
    await queryInterface.removeColumn('refresh_tokens', 'os');
    await queryInterface.removeColumn('refresh_tokens', 'deviceType');
    await queryInterface.removeColumn('refresh_tokens', 'ipAddress');
    await queryInterface.removeColumn('refresh_tokens', 'lastActiveAt');
  },
};
