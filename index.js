const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const fetch = require('node-fetch');
const config = require('./config');
const helpers = require('./helpers');

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

function routeRequests(msg, id) {
    var m = msg.toLowerCase();
    if (generateOr(['hello', 'hi', 'what\'s up', 'hey', 'yo'], m)) {
        sendGreeting(id);
    } else if (generateOr(['feel', 'how are you', 'how do you feel', 'feeling'], m)) {
        sendFeeling(id);
    } else if (generateAnd(['how', 'heaven'], m) || (generateAnd(['what', 'heaven'], m))) {
        sendHeaven(id);
    } else if (generateAnd(['how', 'hell'], m) || (generateAnd(['what', 'hell'], m))) {
        sendHell(id);
    } else if (generateAnd(['who', 'today'], m) || generateAnd(['who', 'see'], m)) {
        sendToday(id);
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
    var answer = ['Don\'t prompt me for my inner feelings! That\'s such a God thing to do...', 'Hey, if you just saw ' +
    'all Hell break loose and a sea of blood how would you feel?', 'Forget about winter is coming--the final three ' +
    'angels are coming...it\'s gonna go from O:) to 3:) real fast...', 'Did you just spend your Saturday night ' +
    'tripping visions of the end of the world? I think not.', 'I\'ll tell you if you tell me why God has a weird ' +
    ':P sign next to your name in the Book of Life...', 'Unlike you, I feel for the Whore of Babylon...', 'Eh. ' +
    'I\'m in one of those less-talking-more-writing-random-stuff moods.'];
    var m1 = answer[Math.floor(Math.random() * answer.length)];
    sendButton(recipientId, 'But why John?', m1);
}

function sendHeaven(recipientId) {
    sendTextMessage(recipientId, 'Check out these swag pictures.');
    loading(recipientId);
    var titles = ['Yeah, the sky opens...', 'It\'s a mess up here...', 'It just never ends...', 'Also there are pretty clouds...'];
    var subtitles = ['The Assumption of the Virgin, Francesco Botticini (1476)', 'The Last Judgment, Michelangelo ' +
    '(1541)', 'The Assumption of the Virgin, Antonio Correggio (1530)', 'The Apotheosis of St. Ignatius, Baciccio ' +
    '(1685)'];
    var urls = ['https://cdn.theconversation.com/files/80385/area14mp/image-20150505-8434-1kfv6q7.jpg',
                'https://cdn.theconversation.com/files/80382/area14mp/image-20150505-8415-1mwaj43.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/e/e1/Correggio%2C_Assumption_of_the_Virgin%2C_Duomo%2C_Parma_01.jpg',
                'https://upload.wikimedia.org/wikipedia/commons/1/10/Baciccio_-_Apotheosis_of_St_Ignatius_-_WGA01110.jpg'];
    var learns = ['http://www.nationalgallery.org.uk/paintings/francesco-botticini-the-assumption-of-the-virgin',
                    'https://www.khanacademy.org/humanities/renaissance-reformation/high-ren-florence-rome/michelangelo/a/michelangelo-last-judgment',
                    'https://en.wikipedia.org/wiki/Assumption_of_the_Virgin_(Correggio)',
                    'http://www.wga.hu/html_m/b/baciccio/apotheos.html'];
    generatePictures(recipientId, titles, subtitles, urls, learns);
}

function sendHell(recipientId) {
    sendTextMessage(recipientId, 'Check out these swag pictures.');
    loading(recipientId);
    var titles = ['When you thought it was hard enough to use one head...', 'They all creepily thirst for your hair...',
                    'Enough. Said.', 'Dinner is served a la hot pot...'];
    var subtitles = ['The Great Red Dragon and the Beast of the Sea, William Blake (1805)', 'The Temptation of St. ' +
                    'Anthony, Matthias Grunewald (1516)', 'The Garden of Earthly Delights, Hieronymus Bosch (1510)',
                    'The Last Judgment, Fra Angelico (1430)'];
    var urls = ['https://uploads0.wikiart.org/images/william-blake/the-great-red-dragon-and-the-beast-from-the-sea-1805.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/a/a5/Matthias_Gr%C3%BCnewald_-_The_Temptation_of_St_Anthony_-_WGA10765.jpg',
        'https://ka-perseus-images.s3.amazonaws.com/6c7a29177325fc57f574dbbeb6f079126d6d0de5.jpg',
        'https://s-media-cache-ak0.pinimg.com/originals/30/b0/f3/30b0f3a39bfcb31c2b8dc18da0c27574.jpg'];
    var learns = ['https://en.wikipedia.org/wiki/The_Great_Red_Dragon_Paintings',
        'https://en.wikipedia.org/wiki/Isenheim_Altarpiece',
        'https://en.wikipedia.org/wiki/The_Garden_of_Earthly_Delights',
        'https://en.wikipedia.org/wiki/The_Last_Judgment_(Fra_Angelico,_Florence)'];
    generatePictures(recipientId, titles, subtitles, urls, learns);
}

function generatePictures(recipientId, titles, subtitles, urls, learns) {
    var elements = [];
    for (var i = 0; i < titles.length; i++) {
        elements.push({
            title: titles[i],
            subtitle: subtitles[i],
            image_url: urls[i],
            buttons: [{
                type: "web_url",
                url: learns[i],
                title: "Learn More"
            }]
        });
    }
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: helpers.shuffle(elements)
                }
            }
        }
    };

    // make POST call
    callSendAPI(messageData);
}

function sendToday(recipientId) {
    var msgs = ['I saw Cain and Abel the other day...still going at it as always. When will Cain ever learn?', 'Oh ' +
    'man! Samson was even more massive in person than I thought. Still laugh at him every time I see him though ' +
    'for falling prey to Delilah >:O', 'Does David ever NOT have his harp with him? He\'s honestly not THAT good...' +
    'I\'d honestly rather fall asleep to the shouts of all those Israelites marching around Jericho with Joshua than ' +
    'David...', 'Daniel was straight out chilling the other day with a lion. So jelly of him. What\'s next? Dragons? ' +
    'If he could sit down and not be annoyed with the pagans for more than 10 seconds I\'d be even more impressed...',
    'Had some wine with Samson the other day...straight up could not finish a tenth of what he did before he even started ' +
    'eating. Major props <3', 'Peter and Paul are STILL arguing over what they should have done for the budding Christian ' +
    'community. I\'m just glad Paul won out on circumsion >:('];
    var m = msgs[Math.floor(Math.random() * msgs.length)];
    sendTextMessage(recipientId, m);
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
                        title: "Pssst...prompt John for more",
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