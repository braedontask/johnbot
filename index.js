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

// simple db for game
var gameData = {};

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
    if (generateOr(['Answer:'], m)) {
        if (generateOr(['0'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 7));
            sendSecondQuestion(id);
        } else if (generateOr(['1 or 2'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 5));
            sendSecondQuestion(id);
        } else if (generateOr(['3 to 5'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 3));
            sendSecondQuestion(id);
        } else if (generateOr(['all of them'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5)));
            sendSecondQuestion(id);
        } else if (generateOr(['John (me)'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 4));
            sendThirdQuestion(id);
        } else if (generateOr(['Matthew'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 1));
            sendThirdQuestion(id);
        } else if (generateOr(['Judas'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) - 3));
            sendThirdQuestion(id);
        } else if (generateOr(['They don\'t talk.'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 2));
            sendFourthQuestion(id);
        } else if (generateOr(['\"Why you gotta play me like that?\"'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 5));
            sendFourthQuestion(id);
        } else if (generateOr(['\"Don\'t come back. Ever.\"'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 8));
            sendFourthQuestion(id);
        } else if (generateOr(['Cain'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 2));
            sendFifthQuestion(id);
        } else if (generateOr(['Jeremiah'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 8));
            sendFifthQuestion(id);
        } else if (generateOr(['Delilah'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 7));
            sendFifthQuestion(id);
        } else if (generateOr(['It\'s gonna be a LIT party!'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 10));
            sendSixthQuestion(id);
        } else if (generateOr(['Eh.'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 1));
            sendSixthQuestion(id);
        } else if (generateOr(['You tell me.'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 5));
            sendSixthQuestion(id);
        } else if (generateOr(['Psalms'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5)));
            endGame(id);
        } else if (generateOr(['Revelation'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5)));
            endGame(id);
        } else {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 5));
            endGame(id);
        }
    } else if (generateOr(['hello', 'hi', 'what\'s up', 'hey', 'yo'], m)) {
        sendGreeting(id);
    } else if (generateOr(['feel', 'how are you', 'feeling', 'how r u'], m)) {
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
    } else if (generateOr(['joke', 'laugh'], m)) {
        sendJoke(id);
    } else if (generateOr(['game', 'play'], m) || generateAnd(['heaven', 'hell'], m)) {
        startGame(id);
    } else {
        sendErrorMessage(id);
    }
}

function receivedPostback(event) {
    var senderID = event.sender.id;
    var id = event.recipient.id;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;

    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, id, payload, timeOfPostback);

    // confirmation of postback
    if (payload.includes('http') || payload.includes('./')) {
        sendFile(senderID, payload);
    } else if (payload.includes('0')) {
        sendTextMessage(senderID, 'received from postback');
    } else {
        sendTextMessage(senderID, payload);
    }
}

// function getUserInfo(id) {
//     request({
//         uri: 'https://graph.facebook.com/v2.6/' + id + '?fields=first_name&access_token=' + config.access_token,
//         qs: { access_token: config.access_token },
//         method: 'GET'
//     }, function (error, response, body) {
//         return response;
//     });
// }

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

function sendGreeting(id) {
    // var name = getUserInfo(id).first_name;
    // sendTextMessage(id, 'Hey ' + name + '!');
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
    'hot today here on Patmos...maybe even hotter than that lake of fire.'];
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
    var titles = ['Yeah, the sky opens...', 'It\'s a mess up here...', 'It just never ends...', 'There are pretty clouds...'];
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
    var titles = ['When you thought it was hard enough to use one head...', 'I literally do not know how to describe ' +
    'these \"things\"...', 'Enough. Said.', 'Dinner is served a la hot pot...'];
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
    sendTextMessage(id, 'Well, you know it\'s hard to really say. I like to go by John but there\'s such a mystery ' +
    'around my identity in popular culture that I derive such pleasure from trolling people and keeping it that way. But I\'ll spare ' +
    'you some pain and give you some information that may or may not be completely accurate :P');
    sendTextMessage(id, 'Here are some portraits of me. Not super accurate but I\'ll leave the rest of the gaps ' +
        'to your imagination.');
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
    sendTextMessage(id, 'I\'m sorry if this is long-winded but my life is pretty cool not gonna lie. I mean, ' +
    'based on the lengthy syntax and elaborate imagery in Revelation, what else would you expect? Hmm...where ' +
    'do I start? I was born around 6 CE in the Roman Empire (not sure if you could tell but the Romans ' +
    'and I sometimes don\'t like each other). You may have noticed my unconventional writing in the ' +
    'Gospel According to John, or the Three Epistles of John (by yours truly). I often rely on Greek philosophy ' +
    'and combine that with a rough, yet potent writing style to give my books some extra kick. History has it that ' +
    'I\'m always represented with an eagle from Ezekiel\'s vision to symbolize ascension and the theological, ' +
    'heavy nature of my writing but I like to think of myself as an Alpha author who\'s beautiful, proud, and ' +
    'always high (just like an eagle!).');
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
    sendTextMessage(id, 'Where was I when I wrote Revelation you ask? Well if you haven\'t been able to tell from ' +
    'my salty messages by now, I\'ve been stuck on this stupid island Patmos (in current day Greece) for what seems ' +
    'like FOREVER :( The Romans banished me here as punishment for my belief in Jesus. Something about Christianity ' +
    'posing a subversive threat blah blah blah to the Roman order. I guess we\'re seen as an alternative order and \"deep ' +
    'state\" to the Romans since we refuse to worship the obviously unholy emperor. Just to drive my point home, Patmos ' +
    'SUCKS. There\'s absolutely no one here, just a bunch of water and super loud birds. See for yourself:');
    sendImage(id, 'https://maps.googleapis.com/maps/api/staticmap?center=Patmos,+Greece&zoom=6&scale=false&size=' +
    '600x600&maptype=roadmap&format=png&visual_refresh=true&markers=size:mid%7Ccolor:0xff0000%7Clabel:%7CPatmos,+Greece');
    sendImage(id, 'https://maps.googleapis.com/maps/api/staticmap?center=Patmos,+Greece&zoom=10&scale=false&size=' +
    '600x600&maptype=roadmap&format=png&visual_refresh=true&markers=size:mid%7Ccolor:0xff0000%7Clabel:%7CPatmos,+Greece');
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

function sendJoke(id) {
    var jokes = ['What\'s worst than burning to death in Hell?', 'Why did the Whore of Babylon cross the road?', 'If ' +
    '2 is better than 1, what is better than 7?', 'What did the Great Red Dragon say to the Whore of Babylon?',
    'Why did God put on sunglasses?', 'Why do I criticize the Laodiceans?', 'What did God say to Pergamos?',
    'Who are these famed Nicolaitans that I hate so much?', 'Why am I not married?'];
    var answers = ['Burning alive in Patmos. Literally. The. Worst.', 'She saw a path of gold and thought she was in Heaven. ' +
    'But PSYCH. She ain\'t ever going to Heaven mwahaha >:)', 'Nothing. Trick question. 7 is literally my fave number.',
    'It\'s about to get lit in here.', 'Because Hell is about to light you up in that infinite sea of fire B-)',
    'Because they are Lao-sy in their obedience toward God\'s commandments (smh they more lukewarm than all this ' +
    'slightly suspicious warm water around me).', 'Stop being so Per-ky with your idols (hehe)...it\'s fine though ' +
    'they hate the Nicolaitans so we all chill.', 'While scholars think the Nicolaitans were a group worshipping idols ' +
    'similar to Balaam, in reality they\'re just a SUPER annoying gaggle of geese that never shut up and move between ' +
    'Patmos and Pergamum.', 'You could say I\'m a little to trippy, wrath-y, lonely for their liking...but then again ' +
    'I\'m stuck on this stupid island so cut me some slack!'];
    var i = Math.floor(Math.random() * jokes.length);
    sendTextMessage(id, jokes[i]);
    setTimeout(function () {
        loading(id);
    }, 500);
    setTimeout(function() {
        sendTextMessage(id, answers[i]);
    }, 7000);
}

function startGame(id) {
    gameData[id] = 0.0;
    var data = [{title: '0', payload: '0'}, {title: '1 or 2', payload: '1'},
    {title: '3 to 5', payload: '2'}, {title: 'all of them', payload: '3'}];
    sendChoices(id, 'How many of the Ten Commandments have you violated in the last week?', data);
}

function gameUpdate(id, change) {
    gameData[id] += change;
}

function sendSecondQuestion(id) {
    var data = [{title: 'John (me)', payload: '0'}, {title: 'Matthew', payload: '1'}, {title: 'Judas', payload: '2'}];
    sendChoices(id, 'Which of the following disciples do you like the best?', data);
}

function sendThirdQuestion(id) {
    var data = [{title: 'They don\'t talk.', payload: '0'}, {title: '\"Why you gotta play me like that?\"', payload: '1'},
    {title: '\"Don\'t come back. Ever.\"', payload: '2'}];
    sendChoices(id, 'What is God\'s most frequent comment to Satan?', data);
}

function sendFourthQuestion(id) {
    var data = [{title: 'Cain', payload: '0'}, {title: 'Jeremiah', payload: '1'}, {title: 'Delilah', payload: '2'}];
    sendChoices(id, 'If you had to pick one of the following biblical names, which would you choose?', data);
}

function sendFifthQuestion(id) {
    var data = [{title: 'It\'s gonna be a LIT party!', payload: '0'}, {title: 'Eh.', payload: '1'},
    {title: 'You tell me.', payload: '2'}];
    sendChoices(id, 'How do you feel about the afterlife?', data);
}

function sendSixthQuestion(id) {
    var data = [{title: 'Psalms', payload: '0'}, {title: 'Revelation', payload: '1'}, {title: 'Esther', payload: '2'}];
    sendChoices(id, 'Pop trivia! The longest verse in the Bible comes from what book?', data);
}

function endGame(id) {
    var score = gameData[id];
    var results = ['I\'m so sorry...you\'ll probs be in Hell.',
    'Dude! LIT! You\'ll be chilling with me in Heaven!',
    'Hehe...I know your fate but I\'m a troll and won\'t tell you (unless you play again).',
    'It\'s 50-50 honestly. Maybe if you cut down on that Netflix binge-watching and go to church more often...',
    'Chances are not looking good but hey, who says God can\'t work miracles ;)',
    'If I revealed it you would hate me...',
    'Do you know what paradise looks like? No? Well you never will...',
    'Grab your sunglasses cuz you\'re future is looking bright B-)',
    'Hellish with a chance of salvation...',
    'Heaven...no Hell...no. Play again, I can\'t really tell.',
    'Meet me by the golden gates when you get to Heaven ;)',
    'I envision you surfing the waves...whether those waves are of the infinite lake of fire or of the holy water I can\'t tell...'];
    if (score > 15) {
        sendTextMessage(id, results[6]);
    } else if (score > 20) {
        sendTextMessage(id, results[5]);
    } else if (score > 25) {
        sendTextMessage(id, results[4]);
    } else if (score > 30) {
        sendTextMessage(id, results[3]);
    } else if (score > 35) {
        sendTextMessage(id, results[8]);
    } else if (score > 37) {
        sendTextMessage(id, results[1]);
    } else if (score > 40) {
        sendTextMessage(id, results[7]);
    } else {
        sendTextMessage(id, results[Math.floor(Math.random() * results.length)]);
    }
    sendButton(id, 'Play again!', 'Am I going to Heaven or Hell...again?');
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
                        title: "Follow-up!",
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

function sendChoices(id, prompt, choices) {
    var data = [];
    for (var i = 0; i < choices.length; i++) {
        data.push({
            content_type: 'text',
            title: 'Answer: ' + choices[i].title,
            payload: choices[i].payload
        });
    }
    var messageData = {
        recipient: {
            id: id
        },
        message: {
            text: prompt,
            quick_replies: data
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