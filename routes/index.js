var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
        res.render('index', { title: 'Zip Viz', heading: 'Zip Group Viewer' });
});

router.get('/render', function(req, res, next) {
        res.render('render', { title: 'Zip Viz', heading: 'Zip Group Viewer' });
});

router.get('/lrender', function(req, res, next) {
        res.render('llrender', { title: 'Zip Viz', heading: 'Zip Group Viewer' });
});

module.exports = router;
