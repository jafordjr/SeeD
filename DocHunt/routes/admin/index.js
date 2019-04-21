'use strict';
const express = require('express');
const router = express.Router();
const getDb = require("../../helper.js").getDb;
const formidable = require('formidable');
const unzipper = require('unzipper');
//const fs = require('fs');
const fs = require('file-system');
const textract = require('textract');
const stream = require('stream');
const sw = require('stopword');
const db = getDb();
/* GET home page. */

function parser(name, filename, text) {
    db.query("INSERT into docs VALUES (?,?,?,?)", [null, name, filename, text], function (err, result) {
        if (err) { throw err; }
        var docId = result.insertId;
        text = text.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '');
        var words = sw.removeStopwords(text.split(' '));
        var frequency = {};
        words.forEach(function (w) {
            if (!frequency[w]) {frequency[w] = 0;}
            frequency[w] += 1;
        });
        var sorted = [];
        for (var word in frequency) {
            if (word !== " " && word !== "" && word !== "." && word !== ",") {
                sorted.push([word, frequency[word]]);
            }
        }
        sorted.sort(function (a, b) {
            return b[1] - a[1];
        });
        for (var i = 0; i < 10 && i < sorted.length; i++) {
            db.query("INSERT into words VALUES (?,?,?,?,?)", [null, docId, sorted[i][0], i + 1, sorted[i][1]], function (err, result) {
                if (err) { throw err; }
            });
        }
    });
}

router.get('/', function (req, res) {
    db.query("SELECT * from docs", function (err, result) { if (err) throw err; res.render('admin/index', { title: 'View All Documents', docs: result, user: req.user });});    
});

router.get('/add', function (req, res) {
    res.render('admin/add', { title: 'Add Document', user: req.user });
});

router.post('/add', function (req, res) {
    var text = "";
    const chunks = [];
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var file = files.filetoupload;
        if (file.name.substr(file.name.lastIndexOf('.') === "doc" || file.name.substr(file.name.lastIndexOf('.') === "docx"))){
            fs.createReadStream(file.path)
                .pipe(unzipper.Parse())
                .pipe(stream.Transform({
                    objectMode: true,
                    transform: function (entry, e, cb) {
                        var fileName = entry.path;
                        var type = entry.type; // 'Directory' or 'File'
                        var size = entry.size;
                        if (fileName === "word/document.xml") {
                            entry.on("data", function (chunk) {
                                chunks.push(chunk);
                                console.log(chunk);
                            })
                                .on("end", function () {
                                    var text = Buffer.concat(chunks).toString();
                                    var body = '';
                                    var components = text.split('<w:t');
                                    for (var i = 0; i < components.length; i++) {
                                        var tags = components[i].split('>');
                                        var content = tags[1].replace(/<.*$/, "");
                                        body += content + ' ';
                                    }
                                    parser(fields.displayname, file.name, body);
                                })
                                .on('finish', cb);
                        } else {
                            entry.autodrain();
                            cb();
                        }
                    }
                }));
        }
        else {
            parser(fields.displayname, file.name, file.toString());
        }
    });
    res.send('done');
}); 

router.get('/:id', function (req, res) {
    db.query("Select d.document, d.filename, d.name, w.count, w.docId, w.rank, w.word FROM words w RIGHT JOIN docs d ON w.docId = d.id WHERE d.id = ?", [req.params.id], function (err, result) { if (err) throw err; res.render('doc', { docs: result, title: 'View Document', user: req.user }) });
});
router.delete('/:id', function (req, res) {
});


module.exports = router;