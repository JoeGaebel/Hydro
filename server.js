// server.js

// set up ========================
var express = require('express');
var app = express(); // create our app w/ express
var morgan = require('morgan'); // log requests to the console (express4)
var bodyParser = require('body-parser'); // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var http = require("http");
var https = require("https");
var store = require("./store"); //Store controls handling of torrent streams (AKA engines)
var pump = require("pump"); //pump and mime are used to stream the data
var mime = require("mime");
var rangeParser = require("range-parser");

// configuration =================


app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users
app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.urlencoded({
    'extended': 'true'
})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
})); // parse application/vnd.api+json as json
app.use(methodOverride());





app.get('/', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});
app.get('/watch', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});


//Scrape the external API, and return a JSON of movie titles
//Used to populate the search after keywords have been specified
app.get('/search', function(req, res) {
    var query = "https://yts.re/api/list.json?limit=10&keywords=" + req.query.keywords;
    console.log("Searching...");
    https.get(query,
        function(getres) {
            // Buffer the body entirely for processing as a whole.
            var bodyChunks = [];
            getres.on('data', function(chunk) {
                bodyChunks.push(chunk);
            }).on('end', function() {
                var body = Buffer.concat(bodyChunks);
                // console.log(body);
                res.send(body);
            })
        })
});


//The external YTS api doesn't provide a description for the movie
//So this call is used to scrape IMDB based on the imdbCode specified
app.get('/description', function(req, res) {
    var query = "http://www.omdbapi.com/?plot=short&r=json&i=" + req.query.i;
    console.log("Getting description....");
    http.get(query,
        function(getres) {
            // Buffer the body entirely for processing as a whole.
            var bodyChunks = [];
            getres.on('data', function(chunk) {
                bodyChunks.push(chunk);
            }).on('end', function() {
                var body = Buffer.concat(bodyChunks);
                // console.log(body);
                res.send(body);
            })
        })
});

//This call creates a torrent engine in the store
//Used to select a particular torrent to begin torrening
//Body must contain a magnet link
app.post('/select', function(req, res) {
    store.begin(req.body.magnet);
    //  console.log("**********************I began!");
});

//This function returns once the torrent is ready to stream
//This comes in handy when you want to wait before you show the video window
app.get('/isLoaded', function(req, res) {
    var torrent = store.get();
    torrent.once("ready", function() {
        console.log("Torrent Ready!");
        res.send();
        if (store.findmp4())
            store.findmp4().select(); //Hack, but a small one
    })

});

//This route pipes the stream of the torrent selected by the post to /torrent
app.get('/stream', function(req, res) {
    console.log("Steaming...");
    var file = store.findmp4();
    if (!file)
        return res.send(404);
    file.select();
    var range = req.headers.range;
    range = range && rangeParser(file.length, range)[0];
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', mime.lookup(file.name));
    req.connection.setTimeout(3600000);

    if (!range) {
        res.setHeader('Content-Length', file.length);
        if (req.method === 'HEAD') {
            return res.end();
        }
        return pump(file.createReadStream(), res);
    }

    res.statusCode = 206;
    res.setHeader('Content-Length', range.end - range.start + 1);
    res.setHeader('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + file.length);

    if (req.method === 'HEAD') {
        return res.end();
    }
    pump(file.createReadStream(range), res);
});







// listen (start app with node server.js) ======================================
app.listen(80);
console.log("App listening on port 80");