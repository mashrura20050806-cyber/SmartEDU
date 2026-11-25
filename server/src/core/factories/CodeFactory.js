const { randomInt } = require('node:crypto');

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const ROLE_PREFIXES = Object.freeze({
  ADMIN: 'ADM',
  PRINCIPAL: 'PRI',
  TEACHER: 'TCH',
  CLASS_TEACHER: 'CLT',
  ASSISTANT: 'AST',
  STUDENT: 'STU',
});

class RoleCodeGenerator {
  constructor(prefix, length = 6) {
    this.prefix = prefix;
    this.length = length;
  }

  generate() {
    let suffix = '';
    for (let index = 0; index < this.length; index += 1) {
      suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    }
    return `${this.prefix}-${suffix}`;
  }
}

class CodeFactory {
  static create(role) {
    const prefix = ROLE_PREFIXES[role];
    if (!prefix) throw new Error(`Unsupported account role: ${role}`);
    return new RoleCodeGenerator(prefix);
  }

  static hasRolePrefix(role, code) {
    const prefix = ROLE_PREFIXES[role];
    return Boolean(prefix && typeof code === 'string' && code.startsWith(`${prefix}-`));
  }
}

module.exports = CodeFactory;
