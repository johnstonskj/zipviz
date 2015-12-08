var express = require('express');
var router = express.Router();

const TITLE = 'Zip Vizualizer';

/* GET home page. */
router.get('/', function(req, res, next) {
        res.render('index', { title: TITLE });
});

router.get('/lrender', function(req, res, next) {
        res.render('llrender', { title: TITLE });
});

router.get('/help', function(req, res, next) {
        res.render('help', { title: TITLE });
});

module.exports = router;
