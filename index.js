// Required for passing environment variables
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
// Initialize with the client access token from api.ai
const apiaiApp = require('apiai')(process.env.APIAI_CLIENT_ACCESS_TOKEN);
const app = express();
// Import constants for the app
const APP_CONSTANTS = require('./utils/constants');
const APP_MESSAGES = require('./utils/messages');
const helper = require('./utils/helper');

const BOOKS = require('./utils/books');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

// Start the server
const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

function prepareBookCategoriesObject() {
  return BOOKS.categories.map((item) => {
    let obj = {};
    obj['type'] = 'postback',
    obj['title'] = item.label;
    obj['payload'] = item.name;
    return obj;
  });
}

const BOOK_CATEGORIES_OBJ = prepareBookCategoriesObject();

console.log('categories is ', BOOK_CATEGORIES_OBJ);

// Function called when getting an input from the user
function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;

  // Send the input to the API.ai
  let apiai = apiaiApp.textRequest(text, {
    sessionId: 'kural_bot'
  });

  // Process on response from API.ai
  apiai.on('response', (response) => {
    // Get the response
    let aiText = response.result.fulfillment.speech;
    let messageObj;

    if(aiText === 'sendBookOptions') {
      messageObj = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [{
              title: APP_MESSAGES.books.select_button_page_1,
              buttons: BOOK_CATEGORIES_OBJ.slice(0, 3)
            }, {
              title: APP_MESSAGES.books.select_button_page_2,
              buttons: BOOK_CATEGORIES_OBJ.slice(3)
            }]
          }
        }
      }
      // messageObj = {
      //   attachment: {
      //     type: 'template',
      //     payload: {
      //       template_type: 'button',
      //       text: APP_MESSAGES.books.select_button,
      //       buttons: BOOK_CATEGORIES_OBJ
      //     }
      //   }
      // }
    } else {
      messageObj = {
        text: aiText
      };
    }

    // Send it back to FB messenger
    request({
      url: APP_CONSTANTS.messenger.url,
      qs: {
        access_token: process.env.FB_ACCESS_TOKEN
      },
      method: 'POST',
      json: {
        recipient: {
          id: sender
        },
        message: messageObj
      }
    }, function (error, response) {
      if (error) {
        console.log('Error sending message: ', error);
      } else if (response.body.error) {
        console.log('Error: ', response.body.error);
      }
    });
  });

  apiai.on('error', (err) => {
    console.log('error ', err);
  });

  apiai.end();

}

function sendBookToUser(event) {
  // Send it back to FB messenger
  let categoryChosen = BOOKS.books[event.postback.payload];

  if(categoryChosen) {
    let book = helper.getRandomElementFromArray(categoryChosen);
    request({
      url: APP_CONSTANTS.messenger.url,
      qs: {
        access_token: process.env.FB_ACCESS_TOKEN
      },
      method: 'POST',
      json: {
        recipient: {
          id: event.sender.id
        },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements: [{
                title: book.label,
                subtitle: book.description,
                default_action: {
                  type: 'web_url',
                  url: book.url[0]
                },
                buttons: [
                  {
                    type: 'web_url',
                    url: book.url[0],
                    title: 'View and Buy'
                  }
                ]
              }]
            }
          }
          //text: book.label + '\n' + book.author + '\n' + book.url[0]
        }
      }
    }, function (error, response) {
      if (error) {
        console.log('Error sending message: ', error);
      } else if (response.body.error) {
        console.log('Error: ', response.body.error);
      }
    });
  }

}

function getKuralFromApi(url, res, intent = APP_CONSTANTS.apiai.kuralIntent) {

  request.get(url, (err, response, body) => {
    if (!err && response && response.statusCode == 200) {
      console.log('response from kural ', err, response.statusCode, body);
      let json = JSON.parse(body);
      let msg = json.content;
      // Replace the break tag from the kural
      msg = msg.replace('<br />', '\n');
      // Add a line between kural and explanation
      msg = msg + '\n------------------\n';
      // Add the kural explanation
      msg = msg + json.explanation;
      return res.json({
        speech: msg,
        displayText: msg,
        source: intent
      });
    } else {
      return res.status(400).json({
        status: {
          code: 400,
          errorType: 'I failed to look up the kural.'
        }
      });
    }
  });
}

function sendBookOptions(res, intent) {
  return res.json({
    speech: 'sendBookOptions',
    displayText: 'sendBookOptions',
    source: intent
  });
}

// Get method used for facebook to verify this app
app.get('/', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

// Post message from the facebook messenger
app.post('/', (req, res) => {

  if(req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if(event.message && event.message.text && !event.message.is_echo) {
          sendMessage(event);
        } else if(event.postback) {
          console.log('event is ', event);
          sendBookToUser(event);
        }
      });
    });
    res.status(200).end();
  }
});

// Fulfillments from API.ai
// This post method will be called by API.ai when it recognises that the user is requesting a kural
app.post(APP_CONSTANTS.apiai.postKuralPath, (req, res) => {

  // Proces only if the user is intenting a kural
  //console.log('getting result', req.body.result.action, APP_CONSTANTS.apiai.kuralIntent);
  const apiAiAction = req && req.body && req.body.result && req.body.result.action;

  if (apiAiAction === APP_CONSTANTS.apiai.kuralIntent) {
    // Get and process the kural number
    let kuralNo = req.body.result.parameters['number'];
    kuralNo = parseInt(kuralNo);

    console.log('kural number is ', kuralNo);

    // If there is no kural number or kural number is not valid
    // send a message to the user
    if(!kuralNo || isNaN(kuralNo)) {
      return res.json({
        speech: APP_MESSAGES.noKuralNo[0],
        displayText: APP_MESSAGES.noKuralNo[0],
        source: APP_CONSTANTS.apiai.kuralIntent
      });
    } 
    // If the kural number is outside bounds,
    // Send a message to the user
    else if(kuralNo < APP_CONSTANTS.kural.min || kuralNo > APP_CONSTANTS.kural.max) {
      return res.json({
        speech: APP_MESSAGES.kuralNoLimit[0],
        displayText: APP_MESSAGES.kuralNoLimit[0],
        source: APP_CONSTANTS.apiai.kuralIntent
      });
    } 
    // Else request the kural from back end API
    else {
      let restUrl = APP_CONSTANTS.kural.url + kuralNo +'.json';
      console.log('sendng request ', restUrl);

      getKuralFromApi(restUrl, res);
      
    }
  }
  else if (apiAiAction === APP_CONSTANTS.apiai.loveIntent ||
    apiAiAction === APP_CONSTANTS.apiai.aramIntent ||
    apiAiAction === APP_CONSTANTS.apiai.porulIntent ||
    apiAiAction === APP_CONSTANTS.apiai.randomIntent
    ) {
    let kuralNo = Math.floor(Math.random() * (APP_CONSTANTS.kural[apiAiAction + 'End'] - APP_CONSTANTS.kural[apiAiAction + 'Start'] + 1)) + APP_CONSTANTS.kural[apiAiAction + 'Start'];  
    let restUrl = APP_CONSTANTS.kural.url + kuralNo +'.json';
    console.log('sendng request ', restUrl);

    getKuralFromApi(restUrl, res, apiAiAction);
  } 
  else if (apiAiAction === APP_CONSTANTS.apiai.bookOptions) {
    sendBookOptions(res, apiAiAction);
  }
  else {
    res.status(200).end();
  }
});