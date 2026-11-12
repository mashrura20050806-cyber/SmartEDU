const { PrismaClient } = require('@prisma/client');

class DatabaseConnection {
  static instance;

  constructor() {
    if (DatabaseConnection.instance) throw new Error('Use DatabaseConnection.getInstance().');
    this.client = new PrismaClient();
  }

  static getInstance() {
    if (!DatabaseConnection.instance) DatabaseConnection.instance = new DatabaseConnection();
    return DatabaseConnection.instance;
  }

  getClient() {
    return this.client;
  }
}

module.exports = DatabaseConnection;