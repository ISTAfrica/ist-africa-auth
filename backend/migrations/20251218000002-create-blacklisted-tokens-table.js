import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('blacklisted_tokens', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deviceInfo: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Device or browser information',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Add index on userId for faster lookups
    await queryInterface.addIndex('blacklisted_tokens', ['userId']);

    // Add index on token for faster blacklist checks
    await queryInterface.addIndex('blacklisted_tokens', ['token']);

    // Add index on expiresAt for cleanup queries
    await queryInterface.addIndex('blacklisted_tokens', ['expiresAt']);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('blacklisted_tokens');
  },
};
