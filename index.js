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
    var id = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    console.log("Received message for user %d and page %d at %d with message:",
        senderID, id, timeOfMessage);
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
    } else if (generateOr(['feel', 'how are you', 'feeling'], m)) {
        sendFeeling(id);
    } else if (generateAnd(['how', 'heaven'], m) || (generateAnd(['what', 'heaven'], m))) {
        sendHeaven(id);
    } else if (generateAnd(['how', 'hell'], m) || (generateAnd(['what', 'hell'], m))) {
        sendHell(id);
    } else if (generateAnd(['who', 'today'], m) || generateAnd(['who', 'see'], m)) {
        sendToday(id);
    } else if (generateOr(['who are you', 'name'], m)) {
        sendName(id);
    } else if (generateOr(['about', 'bio'], m) || generateAnd(['tell', 'more'], m)) {
        sendAbout(id);
    } else if (generateOr(['when', 'write', 'written'], m)) {
        sendWhen(id);
    } else if (generateOr(['where', 'location', 'locate'], m)) {
        sendLocation(id);
    } else if (generateOr(['verse', 'read', 'text'], m)) {
        sendVerse(id);
    } else {
        sendErrorMessage(id);
    }
}

function receivedPostback(event) {
    var senderID = event.sender.id;
    var id = event.recipient.id;
    var timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;

    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, id, payload, timeOfPostback);

    // confirmation of postback
    if (payload.includes('http') || payload.includes('./')) {
        sendFile(senderID, payload);
    } else {
        sendTextMessage(senderID, payload);
    }
}

// sending helpers
function sendTextMessage(id, m) {
    var messageData = {
        recipient: {
            id: id
        },
        message: {
            text: m
        }
    };

    // make POST call
    callSendAPI(messageData);
}

function sendTextMessages(id, ms) {
    for (var i = 0; i < ms.length; i++) {
        sendTextMessage(id, ms[i]);
    }
}

function sendGreeting(id) {
    var greetings = ['What\'s cooking? Still thinking about why I called it Revelation instead of Revelations...I ' +
    'may have only had one collective vision but trust me--they\'re all weird in their own way.', 'Did you know ' +
    'some people say I\'m the only apostle who died a natural death? 3:)', 'How is Patmos you ask? Not good, I can ' +
    'tell you that. Literally just watch birds fly over me and those pagans offshore have fun while I sit and ' +
    'try to hide from that weirdo across the water that keeps peeping at me as I try to write.', 'Hello! It\'s ' +
    'a beautiful day out here in Patmos...said no one ever :|', 'Why do I have an obsession with numbers you ask? ' +
    'Well, aside from the dank symbolism each number holds, honestly I just wanted to be different from all those ' +
    'other authors who run from numbers faster than the pagans will run from God on Judgment Day.', 'Hi! Here\'s some ' +
    'sunglasses B-) jk you won\'t need them because you\'re future beyond earth ain\'t looking so bright...', 'Hey, ' +
    'enjoy this O:) angel...it might just be the last one you ever see...', 'What\'s up! How are you? Man, it\'s sooo ' +
    'hot today here on Patmos...maybe even hotter than that lake of fire.', 'Here\'s a pacman symbol just because ' +
    ':v (even though it hasn\'t been invented yet God showed me...we in 1980 baby!)'];
    var m = greetings[Math.floor(Math.random() * greetings.length)];
    sendTextMessage(id, m);
}

function sendFeeling(id) {
    var feelings = ['Good...but not great.', 'Meh :P God\'s playing games with my mind again', 'I\'m not the Alpha ' +
    'and Omega...how would I know?', 'Nah, the real question is: how are YOU?', 'Could be better...if I wasn\'t ' +
    'stuck on an island by myself.', 'How am I is relative. Relative to you, to the pagans, to my other apostle ' +
    'homies. Hey, even though I\'m not always as philosophical as Paul, I have my moments, okay?', 'I mean, it could ' +
    'be better but at least I\'m not running-through-the-wilderness-as-a-very-naughty-dragon-summons-a-flood-to-kill-me ' +
    'bad like the Whore of Babylon.'];
    var m = feelings[Math.floor(Math.random() * feelings.length)];
    sendTextMessage(id, m);
    var answer = ['Don\'t prompt me for my inner feelings! That\'s such a God thing to do...', 'Hey, if you just saw ' +
    'all Hell break loose and a sea of blood how would you feel?', 'Forget about winter is coming--the final three ' +
    'angels are coming...it\'s gonna go from O:) to 3:) real fast...', 'Did you just spend your Saturday night ' +
    'tripping visions of the end of the world? I think not.', 'I\'ll tell you if you tell me why God has a weird ' +
    ':P sign next to your name in the Book of Life...', 'Unlike you, I feel for the Whore of Babylon...', 'Eh. ' +
    'I\'m in one of those less-talking-more-writing-random-stuff moods.'];
    var m1 = answer[Math.floor(Math.random() * answer.length)];
    sendButton(id, 'But why John?', m1);
}

function sendHeaven(id) {
    sendTextMessage(id, 'Check out these swag pictures.');
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
    generatePictures(id, titles, subtitles, urls, learns);
}

function sendHell(id) {
    sendTextMessage(id, 'Check out these swag pictures.');
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
    generatePictures(id, titles, subtitles, urls, learns);
}

function generatePictures(id, titles, subtitles, urls, learns) {
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
            id: id
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

function sendToday(id) {
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
    sendTextMessage(id, m);
}

function sendName(id) {
    var m = 'Well, you know it\'s hard to really say. I like to go by John but there\'s such a mystery ' +
    'around my identity in popular culture that I derive such pleasure from trolling people and keeping it that way. But I\'ll spare ' +
    'you some pain and give you some information that may or may not be completely accurate :P';
    var m1 = 'Here are some portraits of me. Not super accurate but I\'ll leave the rest of the gaps ' +
    'to your imagination.';
    sendTextMessages(id, [m, m1]);
    var titles = ['I\'m lowkey a book nerd too...', 'Yeah, Jesus and I are tight...', 'Always up for some fine wine ladies!'];
    var subtitles = ['St. John the Evangelist, Domenico Zampieri (1623)', 'The Last Supper, Anonymous (1650)',
    'St. John the Apostle, Peter Paul Rubens (1611)'];
    var urls = ['https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Zampieri_St_John_Evangelist.jpg/1280px-Zampieri_St_John_Evangelist.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/2/2e/An%C3%B4nimo_-_A_%C3%9Altima_Ceia.jpg',
    'http://www.artbible.info/images/rubens_apostel_johannes_grt.jpg'];
    var learns = ['https://en.wikipedia.org/wiki/John_the_Apostle', 'https://en.wikipedia.org/wiki/John_the_Apostle',
    'https://en.wikipedia.org/wiki/John_the_Apostle'];
    generatePictures(id, titles, subtitles, urls, learns);
}

function sendAbout(id) {
    var m = 'I\'m sorry if this is long-winded but my life is pretty cool not gonna lie. I mean, ' +
    'based on the lengthy syntax and elaborate imagery in Revelation, what else would you expect? Hmm...where ' +
    'do I start?';
    var m1 = 'I was born around 6 CE in the Roman Empire (not sure if you could tell but the Romans ' +
    'and I sometimes don\'t like each other). Legend has it I\'ll die soon at age 94 (in 100 CE) on this stupid ' +
    'island Patmos that the Romans have imprisoned me on. You may have noticed my unconventional writing in the ' +
    'Gospel According to John, or the Three Epistles of John (by yours truly). I often rely on Greek philosophy ' +
    'and combine that with a rough, yet potent writing style to give my books some extra kick. History has it that ' +
    'I\'m always represented with an eagle from Ezekiel\'s vision to symbolize ascension and the theological, ' +
    'heavy nature of my writing but I like to think of myself as an Alpha author who\'s beautiful, proud, and ' +
    'always high (just like an eagle!).';
    sendTextMessages(id, [m, m1]);
    sendFileTemplate(id, 'http://totus2us.com/typo3temp/pics/1e211e1830.jpg', 'Check out my formal bio', 'Biography + ' +
    'Analysis', 'http://joshseides.com/pdf/about.pdf');
}

function sendWhen(id) {
    sendTextMessage(id, 'Some people say I wrote a first version of Revelation under the reign of Roman ' +
    'Emperor Vespasian between 69 and 79 CE. Others claim I wrote the prophetic book under Emperor Domitian ' +
    'some time between 81 and 96 CE. The truth? Let\'s just say I wrote Revelation and Patmos and the rest ' +
    'will always be a mystery hahaha :)');
    generatePictures(id, ['Learn more about the debate'], ['If you find these scholars\' struggles as entertaining ' +
    'as I do...'], ['http://40.media.tumblr.com/2b4ee38ada5609c9682f518709565b53/tumblr_mjxk58hIPg1qbhp9xo1_1280.jpg'],
    ['https://books.google.com/books?id=EcsQknxV-xQC&pg=PA504&lpg=PA504&dq=the%20book%20itself' +
    '%20however%20may%20imply#v=onepage&q=the%20book%20itself%20however%20may%20imply&f=false']);
}

function sendLocation(id) {
    var m = 'Where was I when I wrote Revelation you ask? Well if you haven\'t been able to tell from ' +
    'my salty messages by now, I\'ve been stuck on this stupid island Patmos (in current day Greece) for what seems ' +
    'like FOREVER :(';
    var m1 = 'The Romans banished me here as punishment for my belief in Jesus. Something about Christianity ' +
    'posing a subversive threat blah blah blah to the Roman order. I guess we\'re seen as an alternative order and \"deep ' +
    'state\" to the Romans since we refuse to worship the obviously unholy emperor.';
    var m2 = 'Just drive my point home, Patmos SUCKS. There\'s absolutely no one here, just a bunch of water, ' +
    'super loud birds, and these many visions from God which scare the crap out of me. See for yourself:';
    sendTextMessages(id, [m, m1, m2]);
    sendImage(id, 'https://maps.googleapis.com/maps/api/staticmap?center=Patmos,+Greece&zoom=10&scale=false&size=' +
    '1000x1000&maptype=roadmap&format=png&visual_refresh=true');
}

function loading(id) {
    var messageData = {
        recipient: {
            id: id
        },
        sender_action: 'typing_on'
    };

    // make POST call
    callSendAPI(messageData);
}

function sendVerse(id) {
    loading(id);
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
                sendTextMessage(id, quote);
                setTimeout(function () {
                    var caption = 'Revelation ' + chapter + ':' + verse + ' (hmu for more ;) )';
                    sendTextMessage(id, caption);
                }, 100);
            }, 2000);
        })
        .catch(function(err) {
            sendTextMessage(id, 'Revelation 22:13');
            sendTextMessage(id, 'I am Alpha and Omega, the beginning and the end, the first and the last.');
        });
}

function sendErrorMessage(id) {
    var site = 'https://boiling-retreat-40010.herokuapp.com/';
    var text = 'Oh no! I didn\'t understand your message. I\'m not Alpha and the Omega, the beginning and the ' +
            'end (blah blah blah) by the way. Check out ' + site + ' for some things I can talk to you about.';
    sendTextMessage(id, text);
}

function sendButton(id, title, payload) {
    var messageData = {
        recipient: {
            id: id
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

function sendFileTemplate(id, img, title, subtitle, file) {
    var messageData = {
        recipient: {
            id: id
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: title,
                        image_url: img,
                        subtitle: subtitle,
                        buttons: [{
                            type: "postback",
                            title: "Download File",
                            payload: file
                        }]
                    }]
                }
            }
        }
    };

    // make POST call
    callSendAPI(messageData);
}

function sendFile(id, file) {
    var messageData = {
        recipient: {
            id: id
        },
        message: {
            attachment: {
                type: "file",
                payload: {url: file}
            }
        }
    };

    // make POST call
    callSendAPI(messageData);
}

function sendImage(id, link) {
    var messageData = {
        recipient: {
            id: id
        },
        message: {
            attachment: {
                type: "image",
                payload: {url: link}
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
            var id = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent generic message with id %s to recipient %s",
                messageId, id);
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