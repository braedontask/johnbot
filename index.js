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
var gameData = [];

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
    if (generateOr(['answer'], m)) {
        console.log('Here: ' + m);
        if (generateOr(['0'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 7));
            sendSecondQuestion(id);
        } else if (generateOr(['1 or 2'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 5));
            sendSecondQuestion(id);
        } else if (generateOr(['3 to 5'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 3));
            sendSecondQuestion(id);
        } else if (generateOr(['all'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5)));
            sendSecondQuestion(id);
        } else if (generateOr(['john'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 4));
            sendThirdQuestion(id);
        } else if (generateOr(['matthew'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 1));
            sendThirdQuestion(id);
        } else if (generateOr(['judas'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) - 3));
            sendThirdQuestion(id);
        } else if (generateOr(['lame'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 2));
            sendFourthQuestion(id);
        } else if (generateOr(['noob'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 5));
            sendFourthQuestion(id);
        } else if (generateOr(['damnation'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 8));
            sendFourthQuestion(id);
        } else if (generateOr(['cain'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 2));
            sendFifthQuestion(id);
        } else if (generateOr(['jeremiah'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 8));
            sendFifthQuestion(id);
        } else if (generateOr(['delilah'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 7));
            sendFifthQuestion(id);
        } else if (generateOr(['lit'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 10));
            sendSixthQuestion(id);
        } else if (generateOr(['eh'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 1));
            sendSixthQuestion(id);
        } else if (generateOr(['you tell'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5) + 5));
            sendSixthQuestion(id);
        } else if (generateOr(['psalms'], m)) {
            gameUpdate(id, (Math.floor(Math.random() * 5)));
            endGame(id);
        } else if (generateOr(['revelation'], m)) {
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
    } else if (generateAnd(['about', 'book'], m) || generateOr(['revelation', 'theme', 'analysis'], m)) {
        sendTheme(id);
    } else if (generateAnd(['about', 'you'], m) || generateAnd(['tell', 'more'], m) || generateOr(['bio'], m)) {
        sendAbout(id);
    } else if (generateOr(['when', 'write', 'written'], m)) {
        sendWhen(id);
    } else if (generateOr(['where', 'location', 'locate'], m)) {
        sendLocation(id);
    } else if (generateOr(['old testament', 'allusion', 'reference'], m)) {
        sendAllusions(id);
    } else if (generateAnd(['meme', 'analysis'], m) || generateOr(['art'], m)) {
        sendArtAnalysis(id);
    } else if (generateOr(['meme', 'fun'], m)) {
        sendMeme(id);
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
    var timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;

    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, id, payload, timeOfPostback);

    // confirmation of postback
    if (payload.includes('http') || payload.includes('./')) {
        sendFile(senderID, payload);
    } else if (payload.includes('restart')) {
        startGame(senderID);
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

function generateFiles(id, titles, subtitles, imgs, files) {
    var elements = [];
    for (var i = 0; i < titles.length; i++) {
        elements.push({
            title: titles[i],
            subtitle: subtitles[i],
            image_url: imgs[i],
            buttons: [{
                type: "postback",
                title: "Download File",
                payload: files[i]
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

function sendTheme(id) {
    sendTextMessage(id, 'Check out a plot summary here: https://en.wikipedia.org/wiki/Book_of_Revelation');
    sendFileTemplate(id, 'https://z3news.com/w/wp-content/uploads/2015/05/four_horsemen2.jpg', 'Read an original ' +
    'analysis by Josh', 'Thematic Ideas in Revelation', 'http://joshseides.com/pdf/theme.pdf');
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

function sendAllusions(id) {
    var allusions = ['Check out Revelation 2:20. I allude to Jezebel from 1 Kings 16:31 to symbolize human wickedness.',
    'Read Revelation 1:5. I allude to Jesus as the \"faithful witness\" from Psalms 89:37 to develop the ' +
    'perfection and loyalty of Christ and connect to Old Testament hymns.', 'See Revelation 2:7. I mention the \"' +
    'tree of life\" and God\'s paradise in allusion to Genesis 2-3 to form a sense of continuity of God in that ' +
    'Revelation reaffirms the ideas of the very first book of the Bible.', 'If you look closely, Revelation 4:6 ' +
    'compares the glass to a \"crystal,\" echoing its use in Ezekiel 1:22. I thought it would be cool to throw the ' +
    'reference in there since both Ezekiel and I are dope prophets.', 'In Revelation 6:16, I reference Hosea 10:8 ' +
    'through the use of \"fall on us\" and \"hide us\" to represent the parallel fear that humans should feel toward ' +
    'the wrath of an angry God.', 'I subtly include a reference to Daniel 7:10 in Revelation 15:2, connecting the ' +
    '\"fiery stream\" in Daniel to the \"sea of glass mingled with fire\" in Revelation to represent the duality of ' +
    'emotions--wielding both wrath/anger (fire) and tranquility (water)--God exhibits throughout the Bible.', 'Look ' +
    'closely at Revelation 19:19. I allude to a similar depiction in Psalms 2:2, signifying the repeated tendency of ' +
    'humanity to wage a futile battle against God.', 'I pose an interesting contrast in Revelation 22:10 in relation ' +
    'to Daniel 12:4, connecting the Old and New Testaments as a continuous narrative through the commandment to Daniel ' +
    'to \"seal the book\" until Revelation, in which the angel tells me to \"seal not the sayings,\" representing ' +
    'the end of prophecy.'];
    var m = allusions[Math.floor(Math.random() * allusions.length)];
    sendTextMessage(id, m);
}

function sendArtAnalysis(id) {
    var titles = ['Angel of the Revelation', 'The Four Horsemen', 'The Last Judgment', 'The Light of the World'];
    var subtitles = ['William Blake (1805)', 'Albrecht Dürer (1498)', 'Hieronymus Bosch (1508)', 'William Hokman Hunt (1853)'];
    var imgs = ['http://joshseides.com/img/memes/angeloftherevelation_williamblake_1805.jpg',
        'http://joshseides.com/img/memes/thefourhorsemen_albrechtdurer_1498.jpg',
        'http://joshseides.com/img/memes/thelastjudgment_hieronymusbosch_1482.jpg',
        'http://joshseides.com/img/memes/thelightoftheworld_williamhunt_1854.jpg'];
    var files = ['http://joshseides.com/pdf/angelofrevelation_blake.pdf',
        'http://joshseides.com/pdf/fourhorsemen_durer.pdf',
        'http://joshseides.com/pdf/lastjudgment_bosch.pdf',
        'http://joshseides.com/pdf/lightofworld_hunt.pdf'];
    generateFiles(id, titles, subtitles, imgs, files);
}

function sendMeme(id) {
    var memes = ['http://joshseides.com/img/memes/angeloftherevelation_williamblake_1805.jpg',
    'http://joshseides.com/img/memes/danteandvirgil_williamadolphebouguereau_1850.jpg',
    'http://joshseides.com/img/memes/dantesinferno_gustavedore_1868.jpg',
    'http://joshseides.com/img/memes/deathonapalehorse_williamblake_1800.jpg',
    'http://joshseides.com/img/memes/johntheapostleonpatmos_jacopovignali_17thcentury.jpg',
    'http://joshseides.com/img/memes/stjohnaltarpiece_hansmemling_1479.jpg',
    'http://joshseides.com/img/memes/stjohnintheclouds_albrechtdurer_1498.jpg',
    'http://joshseides.com/img/memes/stjohntheevangelistonpatmos_hieronymusbosch_1485.jpg',
    'http://joshseides.com/img/memes/stmichaelarchangel_guidoreni_1636.jpg',
    'http://joshseides.com/img/memes/thebarqueofdante_eugenedelacroix_1822.jpg',
    'http://joshseides.com/img/memes/thedivinecomedy_sandroboticelli_1481.jpg',
    'http://joshseides.com/img/memes/thefourandtwentyelders_williamblake_1805.jpg',
    'http://joshseides.com/img/memes/thefourhorsemen_albrechtdurer_1498.jpg',
    'http://joshseides.com/img/memes/thegardenofearthlydelights_hieronymusbosch_1515.jpg',
    'http://joshseides.com/img/memes/thegreatreddragonandthewomanclothedwiththesun_williamblake_1810.jpg',
    'http://joshseides.com/img/memes/theharvestoftheworld_jacobelloalberegno_1360.jpg',
    'http://joshseides.com/img/memes/thelastjudgment_edwardburnejones_1896.jpg',
    'http://joshseides.com/img/memes/thelastjudgment_fraangelico_1430.jpg',
    'http://joshseides.com/img/memes/thelastjudgment_gustavedore_1897.jpg',
    'http://joshseides.com/img/memes/thelastjudgment_hieronymusbosch_1482.jpg',
    'http://joshseides.com/img/memes/thelastjudgment_lucasignorelli_1502.jpg',
    'http://joshseides.com/img/memes/thelastjudgment_michelangelo_1541.jpg',
    'http://joshseides.com/img/memes/thelastjudgment_petervoncornelius_1839.jpg',
    'http://joshseides.com/img/memes/thelightoftheworld_williamhunt_1854.jpg',
    'http://joshseides.com/img/memes/thenewjerusalem_gustavedore_1865.jpg',
    'http://joshseides.com/img/memes/thenumberofthebestis666_williamblake_1810.jpg',
    'http://joshseides.com/img/memes/thesevenheadeddragon_albrechtdurer_1498.jpg',
    'http://joshseides.com/img/memes/thevisionofdeath_gustavedore_1868.jpg',
    'http://joshseides.com/img/memes/thevisionofthelastjudgment_williamblake_1808.jpg',
    'http://joshseides.com/img/memes/thewhoreofbabylon_williamblake_1809.jpg'];
    var info = ['Angel of the Revelation, William Blake (1805)',
    'Dante and Virgil, William Adolphe-Bougereau (1850)',
    'Dante\'s Inferno, Gustave Doré (1868)',
    'Death on a Pale Horse, William Blake (1800)',
    'John the Apostle on Patmos, Jacopo Vignali (17th century)',
    'St. John Altarpiece, Hans Memling (1479)',
    'St. John in the Clouds, Albrecht Dürer (1498)',
    'St. John the Evangelist on Patmos, Hieronymus Bosch (1485)',
    'St. Michael Archangel, Guido Reni (1636)',
    'The Barque of Dante, Eugène Delacroix (1822)',
    'The Divine Comedy, Sandro Boticelli (1481)',
    'The Four and Twenty Elders, William Blake (1805)',
    'The Four Horsemen, Albrecht Dürer (1498)',
    'The Garden of Earthly Delights, Hieronymus Bosch (1515)',
    'The Great Red Dragon and the Woman Clothed with the Sun, William Blake (1810)',
    'The Harvest of the World, Jacobello Alberegno (1360)',
    'The Last Judgment, Edward Burne-Jones (1896)',
    'The Last Judgment, Fra Angelico (1430)',
    'The Last Judgment, Gustave Doré (1897)',
    'The Last Judgment, Hieronymus Bosch (1482)',
    'The Last Judgment, Lucas Signorelli (1502)',
    'The Last Judgment, Michelangelo (1541)',
    'The Last Judgment, Peter von Cornelius (1839)',
    'The Light of the World, William Holman Hunt (1854)',
    'The New Jerusalem, Gustave Doré (1865)',
    'The Number of the Beast is 666, William Blake (1810)',
    'The Seven-Headed Dragon, Albrecht Dürer (1498)',
    'The Vision of Death, Gustave Doré (1868)',
    'The Vision of the Last Judgment, William Blake (1808)',
    'The Whore of Babylon, William Blake (1809)'];
    var i = Math.floor(Math.random() * memes.length);
    sendTextMessage(id, info[i]);
    setTimeout(function() {
        loading(id);
    }, 500);
    setTimeout(function() {
        sendImage(id, memes[i]);
    }, 2500);
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
    var data = [{title: '0', payload: '0'}, {title: '1 or 2', payload: '1 or 2'},
    {title: '3 to 5', payload: '3 to 5'}, {title: 'all of them', payload: 'all of them'}];
    sendChoices(id, 'How many of the Ten Commandments have you violated in the last week?', data);
}

function gameUpdate(id, change) {
    gameData[id] += change;
}

function sendSecondQuestion(id) {
    var data = [{title: 'John (me)', payload: 'John (me)'}, {title: 'Matthew', payload: 'Matthew'}, {title: 'Judas', payload: 'Judas'}];
    sendChoices(id, 'Which of the following disciples do you like the best?', data);
}

function sendThirdQuestion(id) {
    var data = [{title: 'lame', payload: 'lame'}, {title: 'noob', payload: 'noob'}, {title: 'damnation', payload: 'damnation'}];
    sendChoices(id, 'What is God\'s most frequent word to Satan?', data);
}

function sendFourthQuestion(id) {
    var data = [{title: 'Cain', payload: 'Cain'}, {title: 'Jeremiah', payload: 'Jeremiah'}, {title: 'Delilah', payload: 'Delilah'}];
    sendChoices(id, 'If you had to pick one of the following biblical names, which would you choose?', data);
}

function sendFifthQuestion(id) {
    var data = [{title: 'LIT!!!', payload: 'LIT!!!'}, {title: 'Eh.', payload: 'Eh.'}, {title: 'You tell me.', payload: 'You tell me.'}];
    sendChoices(id, 'How do you feel about the afterlife?', data);
}

function sendSixthQuestion(id) {
    var data = [{title: 'Psalms', payload: 'Psalms'}, {title: 'Revelation', payload: 'Revelation'}, {title: 'Esther', payload: 'Esther'}];
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
    if (score < 8) {
        sendTextMessage(id, results[6]);
    } else if (score < 10) {
        sendTextMessage(id, results[5]);
    } else if (score < 15) {
        sendTextMessage(id, results[4]);
    } else if (score < 20) {
        sendTextMessage(id, results[3]);
    } else if (score < 25) {
        sendTextMessage(id, results[8]);
    } else if (score < 27) {
        sendTextMessage(id, results[1]);
    } else if (score < 32) {
        sendTextMessage(id, results[7]);
    } else {
        sendTextMessage(id, results[Math.floor(Math.random() * results.length)]);
    }
    sendButton(id, 'Play again!', 'restart');
}

function sendErrorMessage(id) {
    var site = 'https://boiling-retreat-40010.herokuapp.com/';
    var text = 'Oh no! I didn\'t understand your message. I\'m not Alpha and the Omega, the beginning and the ' +
            'ending (blah blah blah) by the way. Check out ' + site + ' for some things I can talk to you about.';
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
                        title: "Follow Up",
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