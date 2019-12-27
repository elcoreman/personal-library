"use strict";

const expect = require("chai").expect;
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const MONGODB_CONNECTION_STRING = process.env.MLAB_URI;

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

module.exports = app => {
  app.route("/a").get((req, res) => {
    chai
      .request(server)
      .get("/api/books")
      .end(function(err, res) {
        res.send(assert.equal(res.status, 200));
      });
  });

  app
    .route("/api/books")
    .get((req, res) => {
      MongoClient.connect(
        MONGODB_CONNECTION_STRING,
        { useUnifiedTopology: true },
        (err, client) => {
          if (err) throw err;
          client
            .db("test2")
            .collection("library")
            .find({})
            .toArray((err, books) => {
              if (err) throw err;
              client.close();
              res.json(books);
            });
        }
      );
    })

    .post((req, res) => {
      var title = req.body.title;
      if (!title) return res.status(400).send("no title inserted");
      MongoClient.connect(
        MONGODB_CONNECTION_STRING,
        { useUnifiedTopology: true },
        (err, client) => {
          if (err) throw err;

          client
            .db("test2")
            .collection("library")
            .insertOne({ title, commentcount: 0 }, (err, result) => {
              if (err) throw err;
              let book = result.ops[0];
              client.close();
              res.json({ title: book.title, _id: book._id });
            });
        }
      );
    })

    .delete((req, res) => {
      MongoClient.connect(
        MONGODB_CONNECTION_STRING,
        { useUnifiedTopology: true },
        (err, client) => {
          if (err) throw err;
          client.db("test2").dropDatabase((err, result) => {
            if (err) throw err;
            client.close();
            res.send("complete delete successful");
          });
        }
      );
    });

  app
    .route("/api/books/:id")
    .get((req, res) => {
      var bookid = req.params.id;
      MongoClient.connect(
        MONGODB_CONNECTION_STRING,
        { useUnifiedTopology: true },
        (err, client) => {
          if (err) throw err;
          client
            .db("test2")
            .collection("library")
            .findOne({ _id: ObjectId(bookid) })
            .then(book => {
              if (!book) {
                res.send("no book exists");
                throw null;
              }
              return client
                .db("test2")
                .collection("library")
                .findOne({ _id: ObjectId(bookid) });
            })
            .then(book => {
              client
                .db("test2")
                .collection(String(book._id))
                .find({}, { projection: { _id: 0 } })
                .toArray((err, comments) => {
                  if (err) throw err;
                  delete book.commentcount;
                  let cms = [];
                  comments.forEach(cm => cms.push(cm.comment));
                  book.comments = cms;
                  client.close();
                  res.json(book);
                });
            })
            .catch(err => {
              console.log("catch", err);
              if (err) res.status(500).json({ error: err });
            });
        }
      );
    })

    .post((req, res) => {
      var bookid = req.params.id;
      var comment = req.body.comment;
      MongoClient.connect(
        MONGODB_CONNECTION_STRING,
        { useUnifiedTopology: true },
        (err, client) => {
          if (err) throw err;
          return client
            .db("test2")
            .collection("library")
            .findOne({ _id: ObjectId(bookid) })
            .then(book => {
              if (!book) {
                res.send("no book exists");
                throw null;
              }
              return client
                .db("test2")
                .collection(String(bookid))
                .insertOne({ comment });
            })
            .then(result => {
              return client
                .db("test2")
                .collection("library")
                .findOne({ _id: ObjectId(bookid) });
            })
            .then(book => {
              return Promise.all([
                book,
                client
                  .db("test2")
                  .collection(String(book._id))
                  .find({}, { projection: { _id: 0 } })
                  .toArray()
              ]);
            })
            .then(([book, comments]) => {
              client
                .db("test2")
                .collection("library")
                .updateOne(
                  { _id: ObjectId(book._id) },
                  { $inc: { commentcount: 1 } },
                  (err, result) => {
                    if (err) throw err;
                    delete book.commentcount;
                    let cms = [];
                    comments.forEach(cm => cms.push(cm.comment));
                    book.comments = cms;
                    client.close();
                    res.json(book);
                  }
                );
            })
            .catch(err => {
              console.log("catch", err);
              if (err) res.status(500).json({ error: err });
            });
        }
      );
    })

    .delete((req, res) => {
      var bookid = req.params.id;
      MongoClient.connect(
        MONGODB_CONNECTION_STRING,
        { useUnifiedTopology: true },
        (err, client) => {
          if (err) throw err;
          client
            .db("test2")
            .collection("library")
            .findOne({ _id: ObjectId(bookid) })
            .then(book => {
              if (!book) {
                res.send("no book exists");
                throw null;
              }
              return Promise.all([
                book,
                client
                  .db("test2")
                  .collection("library")
                  .deleteOne({ _id: ObjectId(bookid) })
              ]);
            })
            .then(([book, result]) => {
              return Promise.all([
                book,
                client
                  .db("test2")
                  .collection(bookid)
                  .drop()
              ]);
            })
            .then(([book, result]) => {
              client
                .db("test2")
                .collection("library")
                .updateOne(
                  { _id: ObjectId(book._id) },
                  { $inc: { commentcount: -1 } },
                  (err, result) => {
                    if (err) throw err;
                    client.close();
                    res.send("delete successful");
                  }
                );
            })
            .catch(err => {
              console.log("catch", err);
              if (err) res.status(500).json({ error: err });
            });
        }
      );
    });
};
