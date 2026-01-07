// migrations/YYYYMMDDHHMMSS-add-linkedin-fields-to-users.ts

import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    // Add linkedinId column
    await queryInterface.addColumn('users', 'linkedinId', {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    });

    // Add profilePicture column
    await queryInterface.addColumn('users', 'profilePicture', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface: QueryInterface) {
    // Remove columns if rolling back
    await queryInterface.removeColumn('users', 'linkedinId');
    await queryInterface.removeColumn('users', 'profilePicture');
  },
};