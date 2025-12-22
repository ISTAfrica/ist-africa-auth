'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('Running migration: add-linkedin-fields');
    
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.linkedinId) {
      await queryInterface.addColumn('users', 'linkedinId', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      });
      console.log('✓ Added linkedinId column');
    } else {
      console.log('⚠ linkedinId column already exists, skipping');
    }

    if (!tableDescription.profilePicture) {
      await queryInterface.addColumn('users', 'profilePicture', {
        type: Sequelize.STRING,
        allowNull: true,
      });
      console.log('✓ Added profilePicture column');
    } else {
      console.log('⚠ profilePicture column already exists, skipping');
    }

    console.log('Migration completed successfully');
  },

  async down(queryInterface, Sequelize) {
    console.log('Rolling back migration: add-linkedin-fields');
    
    await queryInterface.removeColumn('users', 'linkedinId');
    console.log('✓ Removed linkedinId column');
    
    await queryInterface.removeColumn('users', 'profilePicture');
    console.log('✓ Removed profilePicture column');
    
    console.log('Rollback completed successfully');
  }
};
