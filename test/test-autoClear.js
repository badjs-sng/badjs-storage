/**
 * Created by chriscai on 2015/1/14.
 */
//
//var MongoClient = require('mongodb').MongoClient;
//
global.MONGDO_URL = "mongodb://betterjs:betterjs4imweb@localhost:27017/badjs";
//
//
//
// require('./autoClear');
GLOBAL.pjconfig = {
    "mongodb": {
        "url": "mongodb://betterjs:betterjs4imweb@localhost:27017/badjs",
        "shard": true,
        "adminUser": "betterjs",
        "adminPassword": "betterjs4imweb"
    },
    "acceptor": {
        "port": 10000,
        "address": "10.185.14.28",
        "subscribe": "badjs",
        "module": "./acceptor/zmq"
    }
};
var MongoClient = require('mongodb').MongoClient;

var log4js = require('log4js'),
    logger = log4js.getLogger();


var url = global.MONGDO_URL;

var mongoDB;
// Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
    if (err) {
        console.info("failed connect to server");
    } else {
        console.info("Connected correctly to server");
    }
    mongoDB = db;
});


// 10 天前的数据
var beforeDate = 1000 * 60 * 60 * 24 * 10;

var autoClearStart = function () {
    console.info('start auto clear data before ' + beforeDate + ' and after 7d will clear again');
    mongoDB.collections(function (error, collections) {
        collections.forEach(function (collection, key) {
            if (collection.s.name.indexOf("badjs") < 0) {
                return;
            }
            console.info("start clear " + collection.s.name);
            collection.deleteMany({date: {$lt: new Date(new Date - beforeDate)}}, function (err, result) {
                if (err) {
                    console.info("clear error " + err);
                } else {
                    console.info("clear success id=" + collection.s.name);
                }
            })
        })
    });
};




