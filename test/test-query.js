/**
 * Created by chriscai on 2015/1/14.
 */

var MongoClient = require('mongodb').MongoClient;

var mongoUrl = "mongodb://betterjs:betterjs4imweb@localhost:27017/badjs";

var mongoDB;
// Use connect method to connect to the Server
MongoClient.connect(mongoUrl, function (err, db) {
    if (err) {
        console.log("failed connect to server");
        return;
    } else {
        console.log("Connected correctly to server");
    }
    mongoDB = db;


    var queryJSON = {};
    // lt endTime     gt startTime
    queryJSON.date = {$lt: new Date(1448841600000), $gt: new Date(1449014400000)};

    queryJSON.level = {$all: [4]};

    var startTime = Date.now();
    mongoDB.collection('badjslog_' + 24).find(queryJSON, function (error, cursor) {
        console.log(error);
        cursor.sort({'date': -1}).skip(0).limit(50000).forEach(function (item) {
            if (item) {
                console.log(JSON.stringify(item));
            }
        });

    });

    console.log(Date.now() - startTime);

});

