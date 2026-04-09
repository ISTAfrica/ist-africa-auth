'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('clients').catch(() => null);
    if (tableExists) return;

    await queryInterface.createTable('clients', {
      id: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      client_id: { type: Sequelize.STRING, allowNull: false, unique: true },
      client_secret: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      redirect_uri: { type: Sequelize.STRING, allowNull: false },
      allowed_origins: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'active' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('clients');
  },
};
