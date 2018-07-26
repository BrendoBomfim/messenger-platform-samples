
/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 */

'use strict';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    body.entry.forEach(function (entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);


      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }

    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = process.env.PAGE_ACCESS_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {

    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

function handleMessage(sender_psid, received_message) {
  let response;

  // Checks if the message contains text
  if (received_message.text) {
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    console.log(received_message.text);
    response = {
      "text": `Você enviou a seguinte mensagem: "${received_message.text}". Agora tente me enviar um anexo!`
    }
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Essa imagem é do galo cego?",
            "subtitle": "Clique em um botão de resposta.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Sim!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "Não!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
  }

  // Send the response message
  callSendAPI(sender_psid, response);
}

function handlePostback(sender_psid, received_postback) {
  console.log('ok')
  let response;
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Obrigado Fortaleza!" }
  } else if (payload === 'no') {
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "image_url": "data:image/jpeg;base64,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"
          }]
        }
      } 
    }
  }


  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}
