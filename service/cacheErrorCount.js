var MongoClient = require('mongodb').MongoClient,
    connect = require('connect');

var fs = require("fs"),
    path = require("path");

var log4js = require('log4js'),
    logger = log4js.getLogger();
var dbName = "count_";
var saveDate;

var url = global.MONGDO_URL;
var mongoDB;
// Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
    if (err) {
        logger.info("failed connect to server");
    } else {
        logger.info("Connected correctly to server");
    }
    mongoDB = db;
});


function insertErrorCount() {
    mongoDB.collections(function (error, collections) {
        if (error || collections) {
            logger.info("mongoDB.collections error " + JSON.stringify(error));
            logger.info('mongoDB collections is' + JSON.stringify(collections[0].s.name));
            return;
        }
        var endDate = new Date(), startDate = new Date(new Date().getTime() - 6 * 60 * 60 * 1000);
        collections.forEach(function (collection, key) {
            if (collection.s.name.indexOf("badjs") < 0 || collection.s.name.indexof('count_') > -1) {
                return;
            }
            logger.info("start count " + collection.s.name);
            logger.debug("start count endDate" + endDate);
            logger.debug("start count startDate" + startDate);
            var cursor = collection.aggregate([
                {$match: {'date': {$lt: endDate, $gt: startDate}}},
                {
                    $group: {
                        _id: {
                            time: {$dateToString: {format: "%Y-%m-%d %H:%M", date: '$date'}}
                        },
                        count: {$sum: 1}
                    }
                },
                {$sort: {"_id": 1}}
            ]);
            cursor.toArray(function (err, result) {
                if (global.debug == true) {
                    logger.debug("query error is=" + JSON.stringify(err));
                    logger.debug('the query collections is' + JSON.stringify(collection));
                    //logger.debug("query result is=" + JSON.stringify(result));
                }
                result.forEach(function (item) {
                    item.time = new Date(item._id.time);
                    delete item._id;
                });
                if (result.length == 0) {
                    result.push({time: startDate, count: 0});
                }
                insertToMongo(collection.s.name, result);
            });
        })
    });
}

function insertToMongo(name, data) {
    var collection = mongoDB.collection(dbName + name);
    collection.insert(data, function (err, result) {
        if (err) {
            console.log("insert mongo err:" + err);
            return;
        } else {
            if (global.debug == true) {
                //logger.debug(result);
            }
        }
    })
}

function getErrorCount(appid, startTime, endTime,callback) {

    var collection = mongoDB.collection('count_badjslog_' + appid);
    var queryJson = {};
    queryJson.time = {$lt: endTime, $gt: startTime};
    collection.find(queryJson).toArray(function (err, result) {
        if (err) {
            callback&&callback(JSON.stringify(err));
            return;
        }
        logger.debug(callback);
        callback&&callback(null,JSON.stringify(result));
    })

    /*var filePath = path.join('.','cache','cacheCountTotal','badjslog_'+appid),
     result = {};
     if(fs.existsSync(filePath)){
     result.ok = true;
     result.data = JSON.parse(fs.readFileSync(filePath));
     }else{
     result.message = "file error";
     result.ok = false;
     }
     return result;*/
}


module.exports = {
    insertAuto: function () {
        setInterval(function () {
            insertErrorCount();
        }, 6 * 60 * 60 * 1000);// work by every six hours;
    },
    getCount: function (appid, startTime, endTime,callback) {
        getErrorCount(appid, startTime, endTime,callback);
    }
}