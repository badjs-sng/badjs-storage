process.chdir("../");


var cacheTotal = require('../service/cacheTotal');

//setInterval(function () {
//    cacheTotal.increase({id: 1})
//}, 3000);
//
//
//setInterval(function () {
//    cacheTotal.increase({id: 2})
//}, 2000);

cacheTotal.getTotal({key: "2015-09-23", id: 24}, function (err, data) {
    console.log('ri le gou le:', err, data);
});

//console.log(process.cwd());