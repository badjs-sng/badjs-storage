var MongoClient = require('mongodb').MongoClient,
    connect = require('connect'),
    fs = require("fs"),
    path = require("path"),
    log4js = require('log4js'),
    logger = log4js.getLogger(),
    dbName = "count_log_",
    saveDate,
    url = 'mongodb://localhost:27017/badjs',
    mongoDB;

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
        if (error || !collections) {
            logger.info("mongoDB.collections error " + JSON.stringify(error));
            logger.info('mongoDB collections is' + JSON.stringify(collections[0].s.name));
            return;
        }
        var endDate = new Date(), startDate = new Date(new Date().getTime() - 6 * 60 * 60 * 1000);
        collections.forEach(function (collection, key) {
            if (collection.s.name.indexOf("badjs") < 0 || collection.s.name.indexOf('count_') > -1) {
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
                logger.info("query error is=" + err);
                logger.info('the query collections is' + collection);
                //logger.debug("query result is=" + JSON.stringify(result));
                result.forEach(function (item) {
                    item.time = new Date(item._id.time);
                    delete item._id;
                });
                if (result.length == 0) {
                    result.push({time: startDate, count: 0});
                }
                var collectionId = collection.s.name.split('_')[1];
                insertToMongo(collectionId, result);
            });
        })
    });
}

function insertToMongo(name, data) {
    logger.info('the inset work is start');
    var collection = mongoDB.collection(dbName + name);
    collection.insert(data, function (err, result) {
        if (err) {
            console.log("insert mongo err:" + err);
            return;
        } else {
            logger.debug(result);
        }
    })
}

setTimeout(function () {
    insertErrorCount();
}, 10000);