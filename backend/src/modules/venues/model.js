const moment = require('moment');

const knex = require('../../knex');


const populateBeer = async checkin => {
  const beer = await knex('beers').where('id', checkin.beer_id).first();
  const beerstyle = await knex.select('name').from('beerstyles').where('id', beer.beerstyle_id).first();
  return Object.assign({
    sightings: checkin.sightings,
    latest_sighting: checkin.latest_sighting,
    beerstyle_name: beerstyle.name,
    untappd_url: beer.slug != null ? `https://untappd.com/b/${beer.slug}/${beer.id}` : null
  }, beer);
};

const getVenueRecommendations = async venueId => {
  const results = await knex('checkins')
    .select('beer_id', 'venue_id')
    .count('checkins.id as sightings')
    .max('checkin_time as latest_sighting')
    .leftJoin('beers', 'checkins.beer_id', 'beers.id')
    .leftJoin('venues', 'checkins.venue_id', 'venues.id')
    .where('beers.avg_rating', '>', 0)
    .andWhere('checkins.venue_id', venueId)
    .andWhere('checkin_time', '>=', moment().subtract(2, 'weeks'))
    .orderBy('beers.avg_rating', 'desc')
    .groupBy('beer_id', 'venue_id', 'beers.avg_rating')
    .limit(50);

  return Promise.all(results.map(await populateBeer));
};

module.exports = {
  getVenueRecommendations
};
