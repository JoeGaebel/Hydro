var fs = require('fs'),
    path = require('path'),
    events = require('events'),
    engine = require('./engine');


var options = {
    tmp: __dirname + "/downloads"
}

var torrents = [];
var toDelete = [];
module.exports = {

    begin: function(magnet) {
        this.clean(function() {
            var e = engine(magnet, options);
            torrents.push(e);
            console.log("torrents length is: " + torrents.length);
        });
    },

    get: function() {
        return torrents[0];
    },

    findmp4: function() {
        var files = torrents[0].files;
        for (var i = 0; i < files.length; i++)
            if (files[i].name.indexOf("mp4") > -1)
                return torrents[0].files[i];


    },

    clean: function(cb) {
        if (torrents.length > 0) {
            for (var i = 0; i < torrents.length; i++)
                toDelete.push(torrents.pop());
            cb();
            for (var i = 0; i < toDelete.length; i++)
                this.kill(toDelete.pop());
        } else return cb();
    },

    kill: function(torrent) {
        torrent.destroy(function(callback) {
            console.log("I killed " + torrent.infoHash);
            torrent.remove(function(callback) {
                console.log(" ");
            });
        });

    }


}