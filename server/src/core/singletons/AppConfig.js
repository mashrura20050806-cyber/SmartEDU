const { env } = require('../../config/env');

class AppConfig {
  static instance;

  constructor() {
    if (AppConfig.instance) throw new Error('Use AppConfig.getInstance().');
    this.values = env;
  }

  static getInstance() {
    if (!AppConfig.instance) AppConfig.instance = new AppConfig();
    return AppConfig.instance;
  }

  get(key) {
    if (!(key in this.values)) throw new Error(`Unknown configuration key: ${key}`);
    return this.values[key];
  }
}

module.exports = AppConfig;