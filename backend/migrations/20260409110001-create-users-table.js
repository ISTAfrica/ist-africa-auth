'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.describeTable('users').catch(() => null);
    if (tableExists) return;

    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      password: { type: Sequelize.STRING, allowNull: false },
      isVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
      otp: { type: Sequelize.STRING, allowNull: true },
      otpExpiresAt: { type: Sequelize.DATE, allowNull: true },
      verificationToken: { type: Sequelize.STRING, allowNull: true, unique: true },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      avatarUrl: { type: Sequelize.STRING, allowNull: true },
      membershipStatus: { type: Sequelize.ENUM('ist_member', 'ext_member'), allowNull: false, defaultValue: 'ext_member' },
      role: { type: Sequelize.ENUM('user', 'admin'), allowNull: false, defaultValue: 'user' },
      isDefaultAdmin: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      statusReason: { type: Sequelize.TEXT, allowNull: true },
      linkedinId: { type: Sequelize.STRING, allowNull: true, unique: true },
      profilePicture: { type: Sequelize.STRING, allowNull: true },
      tokenVersion: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
