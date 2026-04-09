'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('authorization_codes').catch(() => null);
    if (tableExists) return;

    await queryInterface.createTable('authorization_codes', {
      code: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      clientId: { type: Sequelize.STRING, allowNull: false, references: { model: 'clients', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('authorization_codes');
  },
};
