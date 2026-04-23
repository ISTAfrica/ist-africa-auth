'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('clients');
    if (table.requires_company) return;

    await queryInterface.addColumn('clients', 'requires_company', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('clients');
    if (!table.requires_company) return;
    await queryInterface.removeColumn('clients', 'requires_company');
  },
};
