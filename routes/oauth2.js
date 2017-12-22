const express = require('express');
const debug = require('debug')('sc2:server');
const Sequelize = require('sequelize');
const union = require('lodash/union');
const { issueAppToken, issueAppCode, issueAppRefreshToken } = require('../helpers/token');
const { authenticate } = require('../helpers/middleware');
const config = require('../config.json');

const router = express.Router(); // eslint-disable-line new-cap
const Op = Sequelize.Op;

router.get('/oauth2/authorize', async (req, res) => {
  const redirectUri = req.query.redirect_uri;
  const clientId = req.query.client_id;
  const app = await req.db.apps.findOne({
    where: {
      client_id: clientId,
      redirect_uris: { [Op.contains]: [redirectUri] },
    },
  });
  if (!app) {
    debug(`The app @${clientId} has not been setup.`);
    res.redirect('/404');
  } else {
    res.render('index', { title: 'SteemConnect' });
  }
});

router.all('/api/oauth2/authorize', authenticate('user'), async (req, res) => {
  const clientId = req.query.client_id;
  const responseType = req.query.response_type;
  const scope = req.query.scope ? req.query.scope.split(',') : [];
  const authorization = {
    client_id: clientId,
    user: req.user,
    scope: scope.length > 0 ? scope : config.authorized_operations,
  };
  const authorizations = await req.db.authorizations.findOne({
    where: { client_id: clientId, user: req.user },
  });

  if (!authorizations) {
    await req.db.authorizations.create(authorization);
  } else {
    authorization.scope = union(authorization.scope, authorizations.scope);
    await req.db.authorizations.update(
      authorization,
      {
        where: { client_id: clientId, user: req.user },
      }
    );
  }
  if (responseType === 'code') {
    debug(`Issue app code for user @${req.user} using @${clientId} proxy.`);
    const code = issueAppCode(clientId, req.user, scope);
    res.json({ code });
  } else {
    debug(`Issue app token for user @${req.user} using @${clientId} proxy.`);
    const accessToken = issueAppToken(clientId, req.user, scope);
    res.json({
      access_token: accessToken,
      expires_in: config.token_expiration,
      username: req.user,
    });
  }
});

/** Request app access token */
router.all('/api/oauth2/token', authenticate(['code', 'refresh']), (req, res) => {
  debug(`Issue app token for user @${req.user} using @${req.proxy} proxy.`);
  const accessToken = issueAppToken(req.proxy, req.user, req.scope);
  const payload = {
    access_token: accessToken,
    expires_in: config.token_expiration,
    username: req.user,
  };
  if (req.scope.includes('offline')) {
    payload.refresh_token = issueAppRefreshToken(req.proxy, req.user, req.scope);
  }
  res.json(payload);
});

/** Revoke app access token */
router.all('/api/oauth2/token/revoke', authenticate('app'), async (req, res) => {
  await req.db.tokens.destroy({ where: { token: req.token } });
  res.json({ success: true });
});

module.exports = router;