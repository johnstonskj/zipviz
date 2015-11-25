var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
        res.render('index', { title: 'Zip Crusher', heading: 'Zip Centering' });
});

module.exports = router;
