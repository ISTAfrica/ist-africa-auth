import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('users', 'tokenVersion', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Token version for invalidating all tokens on logout from all devices',
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('users', 'tokenVersion');
  },
};
