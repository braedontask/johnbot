const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const fetch = require('node-fetch');
const config = require('./config');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// webhook validation
app.get('/webhook', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === 'johnbot_verify_token') {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

// display the web page
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// message processing
app.post('/webhook', function (req, res) {
    var data = req.body;

    // verify page subscription
    if (data.object === 'page') {
        data.entry.forEach(function(entry) {
            var pageID = entry.id;
            var timeOfEvent = entry.time;

            // Iterate over each messaging event
            entry.messaging.forEach(function(event) {
                if (event.message) {
                    receivedMessage(event);
                } else if (event.postback) {
                    receivedPostback(event);
                } else {
                    console.log("Oh no! An unknown event was received: ", event);
                }
            });
        });

        // success
        res.sendStatus(200);
    }
});

// incoming events handling
function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    var messageId = message.mid;
    var messageText = message.text;
    var messageAttachments = message.attachments;

    if (messageText) {
        routeRequests(messageText, senderID);
    } else if (messageAttachments) {
        sendTextMessage(senderID, "Message with attachment received");
    }
}

function generate(word) {
    return new RegExp('\\b' + word + '\\b');
}

function generateOr(lst, query) {
    for (var i = 0; i < lst.length; i++) {
        if (generate(lst[i]).test(query)) {
            return true;
        }
    }

    // no matches
    return false;
}

function generateAnd(lst, query) {
    for (var i = 0; i < lst.length; i++) {
        if (!generate(lst[i]).test(query)) {
            return false;
        }
    }

    // all matches
    return true;
}

function routeRequests(m, id) {
    if (generateOr(['hello', 'hi', 'what\'s up', 'hey', 'yo'], m)) {
        sendGreeting(id);
    } else if (generateOr(['feel', 'how are you', 'how do you feel'], m)) {
        sendFeeling(id);
    } else if (generateOr(['who', 'name'], m)) {
        sendTextMessage(id, "My name is John. Thanks for asking!")
    } else if (generateOr(['when', 'write', 'written', 'make'], m)) {
        sendTextMessage(id, "I wrote the Book of Revelation around 95 CE.")
    } else if (generateOr(['verse', 'read', 'text'], m)) {
        sendVerse(id);
    } else {
        sendErrorMessage(id);
    }
}

function receivedPostback(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;

    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, recipientID, payload, timeOfPostback);

    // confirmation of postback
    sendTextMessage(senderID, payload);
}

// sending helpers
function sendTextMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    // make POST call
    callSendAPI(messageData);
}

function sendGreeting(recipientId) {
    var greetings = ['What\'s cooking? Still thinking about why I called it Revelation instead of Revelations...I ' +
    'may have only had one collective vision but trust me--they\'re all weird in their own way.', 'Did you know ' +
    'some people say I\'m the only apostle who died a natural death? 3:)', 'How is Patmos you ask? Not good, I can ' +
    'tell you that. Literally just watch birds fly over me and those pagans offshore have fun while I sit and ' +
    'try to hide from that weirdo across the water that keeps peeping at me as I try to write.', 'Hello! It\'s ' +
    'a beautiful day out here in Patmos...said no one ever :|', 'Why do I have an obsession with numbers you ask? ' +
    'Well, aside from the dank symbolism each number holds, honestly I just wanted to be different from all those ' +
    'other authors who run from numbers faster than the pagans will run from God on Judgment Day.', 'Hi! Here\'s some ' +
    'sunglasses 8| jk you won\'t need them because you\'re future beyond earth ain\'t looking so bright...', 'Hey, ' +
    'enjoy this O:) angel...it might just be the last one you ever see...', 'What\'s up! How are you? Man, it\'s sooo ' +
    'hot today here on Patmos...maybe even hotter than that lake of fire.', 'Here\'s a pacman symbol just because ' +
    ':v (even though it hasn\'t been invented yet God showed me...we in 1980 baby!)'];
    var m = greetings[Math.floor(Math.random() * greetings.length)];
    sendTextMessage(recipientId, m);
}

function sendFeeling(recipientId) {
    var feelings = ['Good...but not great.', 'Meh :P God\'s playing games with my mind again', 'I\'m not the Alpha ' +
    'and Omega...how would I know?', 'Nah, the real question is: how are YOU?', 'Could be better...if I wasn\'t ' +
    'stuck on an island by myself.', 'How am I is relative. Relative to you, to the pagans, to my other apostle ' +
    'homies. Hey, even though I\'m not always as philosophical as Paul, I have my moments, okay?', 'I mean, it could ' +
    'be better but at least I\'m not running-through-the-wilderness-as-a-very-naughty-dragon-summons-a-flood-to-kill-me ' +
    'bad like the Whore of Babylon.'];
    var m = feelings[Math.floor(Math.random() * feelings.length)];
    sendTextMessage(recipientId, m);
    sendButton(recipientId, 'But why John, why do you feel this way?', 'But why John, why do you feel this way?');
}

function loading(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: 'typing_on'
    };

    // make POST call
    callSendAPI(messageData);
}

function sendVerse(recipientId) {
    loading(recipientId);
    var base = 'http://labs.bible.org/api/?passage=Revelation%20';
    var chapter = (Math.floor(Math.random() * 22) + 1).toString();
    var max;
    switch (chapter) {
        case '1':
            max = 20;
            break;
        case '2':
            max = 29;
            break;
        case '3':
            max = 22;
            break;
        case '4':
            max = 11;
            break;
        case '5':
            max = 14;
            break;
        case '6':
            max = 17;
            break;
        case '7':
            max = 17;
            break;
        case '8':
            max = 13;
            break;
        case '9':
            max = 21;
            break;
        case '10':
            max = 11;
            break;
        case '11':
            max = 19;
            break;
        case '12':
            max = 17;
            break;
        case '13':
            max = 18;
            break;
        case '14':
            max = 20;
            break;
        case '15':
            max = 8;
            break;
        case '16':
            max = 21;
            break;
        case '17':
            max = 18;
            break;
        case '18':
            max = 24;
            break;
        case '19':
            max = 21;
            break;
        case '20':
            max = 15;
            break;
        case '21':
            max = 27;
            break;
        case '22':
            max = 21;
            break;
        default:
            max = 1;
    }
    var verse = (Math.floor(Math.random() * max) + 1).toString();
    var url = base + chapter + ':' + verse + '&type=json';
    fetch(url)
        .then(function(res) {
            return res.json();
        })
        .then(function(json) {
            var quote = '\"' + json[0].text.replace(/&#8211;/g,'').replace(/['"]+/g, '') + '\"';
            setTimeout(function () {
                sendTextMessage(recipientId, quote);
                setTimeout(function () {
                    var caption = 'Revelation ' + chapter + ':' + verse + ' (hmu for more trippy stuff ;) )';
                    sendTextMessage(recipientId, caption);
                }, 100);
            }, 2000);
        })
        .catch(function(err) {
            sendTextMessage(recipientId, 'Revelation 22:13');
            sendTextMessage(recipientId, 'I am Alpha and Omega, the beginning and the end, the first and the last.');
        });
}

function sendErrorMessage(recipientId) {
    var site = 'https://boiling-retreat-40010.herokuapp.com/';
    var text = 'Oh no! I didn\'t understand your message. I\'m not Alpha and the Omega, the beginning and the ' +
            'end (blah blah blah) by the way. Check out ' + site + ' for some things I can talk to you about.';
    sendTextMessage(recipientId, text);
}

function sendButton(recipientId, title, payload) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: "Prompt John",
                        //subtitle: "Next-generation virtual reality",
                        //item_url: "https://www.oculus.com/en-us/rift/",
                        //image_url: "http://messengerdemo.parseapp.com/img/rift.png",
                        buttons: [{
                            type: "postback",
                            title: title,
                            payload: payload
                        }]
                    }]
                }
            }
        }
    };

    // make POST call
    callSendAPI(messageData);
}

// return POST response to Facebook server
function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: config.access_token },
        method: 'POST',
        json: messageData
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent generic message with id %s to recipient %s",
                messageId, recipientId);
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });
}

// set up Express server for HTTP requests
var server = app.listen(process.env.PORT || 3000, function () {
    console.log("Listening on port %s", server.address().port);
});