'use strict';
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Express' });
});

router.get('/search', function (req, res){
	res.render('client/search', { title: 'Search', user: req.user })
});

module.exports = router;
