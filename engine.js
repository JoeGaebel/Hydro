'use strict';
var torrentStream = require('torrent-stream');

module.exports = function(torrent, options) { //Wrapper for the engine
    var engine = torrentStream(torrent, options);

    engine.once('verifying', function() { //Slap on some extra events
        console.log('verifying ' + engine.infoHash);
        engine.files.forEach(function(file, i) {
            console.log(i + ' ' + file.name);
        });
    });

    engine.once('ready', function() { //Slap on some extra events
        console.log('ready ' + engine.infoHash);
        engine.torrent.ready = true;

    });

    engine.on('uninterested', function() { //Slap on some extra events
        console.log('uninterested ' + engine.infoHash);
    });

    engine.on('interested', function() { //Slap on some extra events
        console.log('interested ' + engine.infoHash);
    });

    engine.on('error', function(e) { //Slap on some extra events
        console.log('error ' + engine.infoHash + ': ' + e);
    });

    engine.once('destroyed', function() { //Slap on some extra events
        console.log('destroyed ' + engine.infoHash);
        engine.removeAllListeners();
    });

    return engine;
};