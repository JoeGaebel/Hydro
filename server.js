// server.js

// set up ========================
var express = require('express');
var app = express(); // create our app w/ express
var mongoose = require('mongoose'); // mongoose for mongodb
var morgan = require('morgan'); // log requests to the console (express4)
var bodyParser = require('body-parser'); // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var http = require("http");
var https = require("https");
var store = require("./store");
var pump = require("pump");
var mime = require("mime");
var rangeParser = require("range-parser");

// configuration =================

//mongoose.connect('mongodb://node:node@mongo.onmodulus.net:27017/uwO3mypu');     // connect to mongoDB database on modulus.io

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


// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });




app.get('/', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});
app.get('/watch', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});

//req.query.keywords accesses the keywords from the form

app.get('/search', function(req, res) {
    var query = "https://yts.re/api/list.json?limit=50&keywords=" + req.query.keywords;
    console.log("I'm sending:" + query);
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

app.get('/description', function(req, res) {
    var query = "http://www.omdbapi.com/?plot=short&r=json&i=" + req.query.i;
    console.log("I'm sending:" + query);
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

app.post('/torrent', function(req, res) {
    store.begin(req.body.magnet);
    console.log("**********************I began!");
});


app.get('/loaded', function(req, res) {
    var torrent = store.get();
    torrent.once("ready", function() {
        console.log("I'm ready!!!!");
        res.send();
    })

});

app.get('/torrent/files', function(req, res) {
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




//====================Now some streaming stuff
// var server = http.createServer();
// server.listen(8000);
// server.on('request', function(req, res) {
//     var doodad = new Doodad();
//     res.writeHead(200, {
//         'Content-Type': 'text/doodad'
//     });
//     res.end(doodad);
// });

// var torrentStream = require('torrent-stream');
// var engine = torrentStream('magnet:?xt=urn:btih:84d8304fed96fda24ae555023a9e693b79b2d3f4&dn=Guardians+of+the+Galaxy+2014+RETAIL+DVDRip+X264-PLAYNOW&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Ftracker.istole.it%3A6969&tr=udp%3A%2F%2Fopen.demonii.com%3A1337');
// var stream;
// engine.on('ready', function() {
//     engine.files.forEach(function(file) {
//         console.log('filename:', file.name);
//         stream = file.createReadStream();
//         console.log("I ran!");
//         // stream is readable stream to containing the file content
//     });
// })