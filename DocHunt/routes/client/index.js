'use strict';
const express = require('express');
const router = express.Router();
const getDb = require("../../helper.js").getDb;
const db = getDb();

/* GET home page. */
router.get('/', function (req, res) {
    var page;
    if (req.params.page == null) { page = 0; }
    else if (req.params.page < 0) { page = 0; }
    else { page = req.params.page; }
    page *= 10;
    db.query("SELECT * FROM words w LEFT JOIN (SELECT * FROM docs Limit ?, 10)d on w.docId = d.id ORDER BY w.docId ASC", [page], function (err, result) {
        if (err) throw err;
        res.render('client', { docs: result, page: page, title: 'Search For Document', user: req.user })
    });
});

router.get('/search', function (req, res) {
    var searchQuery = req.query.keywords;
    searchQuery = searchQuery.split(',');
    var search = 'SELECT * FROM words WHERE word = "' + searchQuery[0] + '"';
    for (var i = 1; i < searchQuery.length; i++){
        search += ' or word = "' + searchQuery[i] + '"';
    }
    console.log(search);
    db.query(search , function (err, result) {
        if (err) throw err;
        var score = {};
        var frequency = {};
        result.forEach(function (w) {
            if (searchQuery.includes(w.word))
                if (!score[w.docId]) {
                    score[w.docId] = {
                        "score": 0,
                        words: []
                    }
                };
            score[w.docId].score += w.rank;
            score[w.docId].words.push([w.word, w.rank]);
        });
        var sorted = [];
        for (var docId in score) {
            sorted.push([docId, score[docId].score, score[docId].words]);
        }
        sorted.sort(function (a, b) {
            return a[1] - b[1];
        });
        if (sorted.length > 5)sorted = sorted.slice(0, 5);
        search = "Select DISTINCT * FROM docs d WHERE d.id = " + sorted[0][0];
        for (var i = 1; i < sorted.length && i < 5 ; i++) {
            search += " or d.id = " + sorted[i][0];
        }
        db.query(search, function (err, result) {
            if (err) throw err;
            for (var doc in sorted) {
                for (var r in result) {
                    if (parseInt(sorted[doc][0], 10) == result[r].id) {
                        sorted[doc].push(result[r].name);
                        sorted[doc].push(result[r].document);
                    }
                }
            }
            res.render('client/search', { docs: sorted, searchQuery: searchQuery, title: 'Document Search Results', user: req.user })
        });
    });
});
router.get('/:id', function (req, res) {
    db.query("SELECT  d.document, d.filename, d.name, w.count, w.docId, w.rank, w.word FROM words w RIGHT JOIN docs d ON w.docId = d.id WHERE d.id = ?", [req.params.id], function (err, result) {
        if (err) throw err;
        res.render('doc', { docs: result, title: 'View Document', user: req.user })
    });
});

module.exports = router;
