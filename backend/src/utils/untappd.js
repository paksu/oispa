const _ = require('lodash');
const https = require('./https');
const url = require('url');

const logger = require('./logger').create('untappd');


const UNTAPPD_API_HOST = 'api.untappd.com';
const UNTAPPD_API_VERSION = 'v4';

const THE_PUB_RADIUS_FORMAT = 'km';

const logRequest = req => logger.info(url.format({
  hostname: `${req.hostname}/${req.path}`,
  query: _.omit(req.query, 'client_id', 'client_secret')
}).toString());

const checkRateLimit = res => {
  const requestsRemaining = res.headers['x-ratelimit-remaining'];
  if (requestsRemaining < 20) {
    logger.warn(`Reaching hourly Untapped API limit soon, only ${requestsRemaining} API requests remaining`);
  }
};

const sendUntappdRequest = async opts => {
  const req = {
    hostname: UNTAPPD_API_HOST,
    path: `${UNTAPPD_API_VERSION}/${opts.path}`,
    query: Object.assign({}, opts.query, {
      client_id: process.env.UNTAPPD_CLIENT_ID,
      client_secret: process.env.UNTAPPD_CLIENT_SECRET
    })
  };

  logRequest(req);

  const res = await https.get(req);

  checkRateLimit(res);

  if (res.body.meta.code > 299) {
    throw new Error(JSON.stringify(res));
  }
  return res.body.response;
};

const getBeer = async (opts = {}) => {
  const response = await sendUntappdRequest({
    path: `beer/info/${opts.beer_id}`
  });
  return response.beer;
};

const getCheckins = async (opts = {}) => {
  const response = await sendUntappdRequest({
    path: 'thepub/local',
    query: {
      max_id: opts.max,
      min_id: opts.min,
      limit: opts.limit,
      lat: opts.area.coords.lat,
      lng: opts.area.coords.lng,
      radius: opts.area.coords.radius,
      dist_pref: THE_PUB_RADIUS_FORMAT
    }
  });
  return response.checkins.items;
};

module.exports = {
  getBeer,
  getCheckins
};
