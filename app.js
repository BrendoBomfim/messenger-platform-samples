
'use strict';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const
  request = require('request').defaults({ encoding: null }),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()),
  fs = require('fs'),
  dir = './tmp',
  http = require('http');

app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

app.post('/webhook', (req, res) => {

  let body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(function (entry) {
      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id;

      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
        afterPostback(sender_psid, webhook_event.postback);
      }

    });
    res.status(200).send('EVENT_RECEIVED');

  } else {
    res.sendStatus(404);
  }

});

app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.PAGE_ACCESS_TOKEN;
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

function handleMessage(sender_psid, received_message) {

  if (received_message.text) {
    console.log(received_message.text);
  } else if (received_message.attachments) {
    let attachment_url = received_message.attachments[0].payload.url;
    console.log(attachment_url);
    let base64file = download(attachment_url);
    console.log(base64file);
    upload_local(sender_psid, base64file);
  }
  
  

}

function upload(sender_psid){
  let response;
    response = {
      "attachment": {
        "type": "image",
        "payload": {
          "url": "https://vignette.wikia.nocookie.net/meme/images/f/f4/Galo_Cego.jpg/revision/latest?cb=20170128222653&path-prefix=pt-br",
          "is_reusable":false     
                  }  
              }
      }
    
    callSendAPI(sender_psid, response, null);
}



function upload_local(sender_psid, data){
  let response;
  let file_data;
  
  console.log("Vai tentar enviar");
  var ba64 = require("ba64"),
    data_url = data;

    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
      console.log(dir);
    }

    response = {
      "attachment": {
        "type": "image",
        "payload": {
          "is_reusable":false     
                  }  
              }
      }
    file_data = "@./tmp/galocego.jpeg;type=image/jpeg" 
    console.log(data_url);
    ba64.writeImage("./tmp/galocego.jpeg", data_url, function(err){
      if (err) throw err;
      else{
        console.log("Image prepared to be send");
        callSendAPI(sender_psid, response, file_data);
      }
      
     });
}

function handlePostback(sender_psid, received_postback) {
  let response;
  let payload = received_postback.payload;

  if (payload === 'yes') {
    response = { "text": "Obrigado Fortaleza!" }
  } else if (payload === 'no') {
    response = { "text": "Apois mande do galo cego então..." }
  }

  callSendAPI(sender_psid, response, null);
}

function download(url) {
  request.get(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
        //console.log(data);
        return data;
    }
  });
};

function afterPostback(sender_psid, received_postback) {
  let response;
  let payload = received_postback.payload;

  if (payload === 'yes') {
    response = {
      "message": {
        "attachment": {
          "type": "image",
          "payload": {
            "url": "https://vignette.wikia.nocookie.net/meme/images/f/f4/Galo_Cego.jpg/revision/latest?cb=20170128222653&path-prefix=pt-br",
            "is_reusable":true     
          } 
          }
        }
      }
    
  } else if (payload === 'no') {
    response = { "text": "Apois mande do galo cego então..." }
  }

  callSendAPI(sender_psid, response, null);
}

function callSendAPI(sender_psid, response, file_data) {
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response,
    "filedata=": file_data
  }

  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
      console.log(res)
    } else {
      console.error("Unable to send message:" + err);
      console.log(res)
    }
  });
}
