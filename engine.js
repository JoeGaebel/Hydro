'use strict';
var torrentStream = require('torrent-stream');

module.exports = function(torrent, options) {
    var engine = torrentStream(torrent, options);

    engine.once('verifying', function() {
        console.log('verifying ' + engine.infoHash);
        engine.files.forEach(function(file, i) {
            console.log(i + ' ' + file.name);
        });
    });

    engine.once('ready', function() {
        console.log('ready ' + engine.infoHash);
        engine.torrent.ready = true;

    });

    engine.on('uninterested', function() {
        console.log('uninterested ' + engine.infoHash);
    });

    engine.on('interested', function() {
        console.log('interested ' + engine.infoHash);
    });

    engine.on('error', function(e) {
        console.log('error ' + engine.infoHash + ': ' + e);
    });

    engine.once('destroyed', function() {
        console.log('destroyed ' + engine.infoHash);
        engine.removeAllListeners();
    });

    return engine;
};