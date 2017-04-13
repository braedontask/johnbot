const fetch = require('node-fetch');

module.exports = {
    getVerse: function() {
        var base = 'http://labs.bible.org/api/?passage=Revelation+';
        var chapter = (Math.floor(Math.random() * 22) + 1).toString();
        var max = 1;
        switch (chapter) {
            case 1:
                max = 20;
                break;
            case 2:
                max = 29;
                break;
            case 3:
                max = 22;
                break;
            case 4:
                max = 11;
                break;
            case 5:
                max = 14;
                break;
            case 6:
                max = 17;
                break;
            case 7:
                max = 17;
                break;
            case 8:
                max = 13;
                break;
            case 9:
                max = 21;
                break;
            case 10:
                max = 11;
                break;
            case 11:
                max = 19;
                break;
            case 12:
                max = 17;
                break;
            case 13:
                max = 18;
                break;
            case 14:
                max = 20;
                break;
            case 15:
                max = 8;
                break;
            case 16:
                max = 21;
                break;
            case 17:
                max = 18;
                break;
            case 18:
                max = 24;
                break;
            case 19:
                max = 21;
                break;
            case 20:
                max = 15;
                break;
            case 21:
                max = 27;
                break;
            case 22:
                max = 21;
                break;
            default:
                max = 1;
        }
        var verse = (Math.floor(Math.random() * max) + 1).toString();
        var url = base + chapter + verse + '&type=json';
        fetch(url)
            .then(function(res) {
                return res.json();
            })
            .then(function(json) {
                return JSON.parse(json);
            })
            .catch(function(err) {
                console.log('Error: ' + err);
                return {
                    bookname: 'Revelation',
                    chapter: '22',
                    verse: '13',
                    text: 'I am Alpha and Omega, the beginning and the end, the first and the last.'
                }
            });
    }
};