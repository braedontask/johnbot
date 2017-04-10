var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    res.send('The John Bot (server)');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'johnbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
            var args = event.message.text.split(' '), keyword = args[0];
            if (keyword === 'kitten' && args.length === 3) {
                kittenMessage(event.sender.id, event.message.text);
            } else if (keyword === 'spaghetti') {
                navySealMessage(event.sender.id, event.message.text);
            } else if (keyword === 'test') {
                sendMessage(event.sender.id, {text: "Hello."});
            } else {
                sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
            }
        } else if (event.postback) {
            console.log("Postback received: " + JSON.stringify(event.postback));
        }
    }
    res.sendStatus(200);
});

function chunkText(text) {
    var chunks = text.match(/(.|[\r\n]){1,600}/g);
    return chunks;
};

// generic function sending messages
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

function navySealMessage(recipientId, text) {
    if (text.toLowerCase() === 'spaghetti') {
        var navySealCopypasta = "What the fuck did you just fucking say about me, you little bitch? I’ll have you know I graduated top of my class in the Navy Seals, and I’ve been involved in numerous secret raids on Al-Quaeda, and I have over 300 confirmed kills. I am trained in gorilla warfare and I’m the top sniper in the entire US armed forces. You are nothing to me but just another target. I will wipe you the fuck out with precision the likes of which has never been seen before on this Earth, mark my fucking words. You think you can get away with saying that shit to me over the Internet? Think again, fucker. As we speak I am contacting my secret network of spies across the USA and your IP is being traced right now so you better prepare for the storm, maggot. The storm that wipes out the pathetic little thing you call your life. You’re fucking dead, kid. I can be anywhere, anytime, and I can kill you in over seven hundred ways, and that’s just with my bare hands. Not only am I extensively trained in unarmed combat, but I have access to the entire arsenal of the United States Marine Corps and I will use it to its full extent to wipe your miserable ass off the face of the continent, you little shit. If only you could have known what unholy retribution your little “clever” comment was about to bring down upon you, maybe you would have held your fucking tongue. But you couldn’t, you didn’t, and now you’re paying the price, you goddamn idiot. I will shit fury all over you and you will drown in it. You’re fucking dead, kiddo.";
        var chunkySeal = chunkText(navySealCopypasta);
        chunkySeal.reverse().forEach(function(chunk) {
            //TODO: FIX THIS QUICK FIX
            setTimeout(function() {
                sendMessage(recipientId, {text: chunk});
            }, 100);
        });
        return true;
    }
    return false;
}

// send rich message with kitten
function kittenMessage(recipientId, text) {
    var values = text.split(' ');
    if (Number(values[1]) > 0 && Number(values[2]) > 0) {

        var imageUrl = "https://placekitten.com/" + Number(values[1]) + "/" + Number(values[2]);

        message = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Kitten",
                        "subtitle": "Cute kitten picture",
                        "image_url": imageUrl ,
                        "buttons": [{
                            "type": "web_url",
                            "url": imageUrl,
                            "title": "Show kitten"
                        }, {
                            "type": "postback",
                            "title": "I like this",
                            "payload": "User " + recipientId + " likes kitten " + imageUrl,
                        }]
                    }]
                }
            }
        };
        sendMessage(recipientId, message);
        return true;
    }
    return false;
};