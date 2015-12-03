var express = require('express');
var router = express.Router();

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./data/us_zip_codes.db');

/* GET users listing. */
router.get('/zipcodes', function(req, res, next) {
        var keys = req.query.q.split(',');
        var keystring = '';
        for (var i = 0; i<keys.length; i++) {
            // TODO: validate!
            keys[i] = '"' + keys[i] + '"';
        }
        keystring = keys.join(',');
        var stmt = 'SELECT key, json FROM geo_data WHERE type = "uszip" AND key IN (' + keystring + ')';
        db.serialize(function() {
                db.all(stmt, function(err, rows) {
                        if (err !== null) {
                            console.log(err);
                            res.json({'error': err});
                        } else {
                            var results = {};
                            rows.forEach(function(row) {
                                    results[row.key] = JSON.parse(row.json);
                                });
                            res.json(results);
                        }
                    });
            });
});

module.exports = router;
