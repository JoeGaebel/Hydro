var fs = require('fs'),
    path = require('path'),
    events = require('events'),
    engine = require('./engine');


var options = {
    tmp: __dirname + "/downloads", //Set download path
    uploads: 1 //Reduce number of uploads, sorry torrent community!

}

var torrents = [];
var toDelete = [];
module.exports = {

    begin: function(magnet) { //Start a torrent engine, get rid of the others
        //TODO: Allow users stream particular torrent engines based on their infoHash
        //TODO: Cleanup will be required so that only... 5 or so torrents can run at a given time
        this.clean(function() {
            var e = engine(magnet, options); //Create an engine with the options specified
            torrents.push(e); //Push it into the array
            console.log("torrents length is: " + torrents.length);
        });
    },

    get: function() {
        return torrents[0]; //Return the first engine
    },

    findmp4: function() { //Search through the files in the torrent to find the one that's a movie..
        //TODO: This is very dirty. If a torrent contains two mp4 files it needs to find the bigger one
        //Needs support for different file types
        var files = torrents[0].files;
        for (var i = 0; i < files.length; i++)
            if (files[i].name.indexOf("mp4") > -1)
                return torrents[0].files[i];


    },

    clean: function(cb) { //Immediately empties the torrent engine array, and
        //send their values off to be destroyed async'ly
        if (torrents.length > 0) {
            for (var i = 0; i < torrents.length; i++)
                toDelete.push(torrents.pop());
            cb();
            for (var i = 0; i < toDelete.length; i++)
                this.kill(toDelete.pop());
        } else return cb();
    },

    kill: function(torrent) { //Call the engine's build in destroy and remove functions
        torrent.destroy(function(callback) {
            console.log("I killed " + torrent.infoHash);
            torrent.remove(function(callback) {
                console.log(" ");
            });
        });

    }


}