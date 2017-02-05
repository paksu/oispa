import _ from 'lodash';
import scrapeIt from 'scrape-it';
import AWS from 'aws-sdk';

const UPDATE_SCRAPE_URL = 'https://untappd.com/beer/top_rated';
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * Retrieves all beerstyles from DynamoDB.
 */
export const get = (event, context, callback) => {
  dynamodb.scan({
    TableName: 'Beerstyles'
  }).promise().then(({ Items }) => {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(Items)
    });
  }).catch(err => {
    console.log(err);
    callback(err);
  });
};

/**
 * Updates all beer styles by scraping them from Untappd website and storing
 * the results to DynamoDB.
 */
export const update = (event, context, callback) => {
  scrapeIt({
    url: UPDATE_SCRAPE_URL,
    encoding: 'UTF-8'
  }, {
    items: {
      listItem: '#filter_picker option',
      data: {
        id: {
          attr: 'value'
        },
        name: {
          how: 'html'
        }
      }
    }
  }).then(({ items }) => {
    const operations = _.drop(items).map(item => dynamodb.put({
      TableName: 'Beerstyles',
      Item: {
        id: parseInt(item.id, 10),
        name: item.name
      }
    }).promise());

    return Promise.all(operations);
  }).then(results => {
    console.log(`Updated ${results.length} beer types`);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(results.length)
    });
  }).catch(err => {
    console.error(err);
    callback(err);
  });
};