'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'membershipStatus', {
      type: Sequelize.ENUM('ist_member', 'ext_member'),
      allowNull: false,
      defaultValue: 'ext_member',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'membershipStatus');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_users_membershipStatus";'
    );
  },
};


