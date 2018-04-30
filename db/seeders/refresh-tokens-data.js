'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('refresh_tokens', [
      {
        client_id: 'busy.app',
        user: 'guest123',
        token: 'secret-token-123',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('refresh_tokens', null, {});
  }
};
