"use strict";

const expect = require("chai").expect;
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const MONGODB_CONNECTION_STRING = process.env.MLAB_URI;

module.exports = app => {
  app
    .route("/api/books")
    .get((req, res) => {
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, client) => {
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
      });
    })

    .post((req, res) => {
      var title = req.body.title;
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, client) => {
        if (err) throw err;
        client
          .db("test2")
          .collection("library")
          .insertOne(
            { title: req.body.title, commentcount: 0 },
            (err, book) => {
              if (err) throw err;
              client.close();
              res.json({ title: book.title, _id: book._id });
            }
          );
      });
    })

    .delete((req, res) => {
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, client) => {
        if (err) throw err;
        client.db("test2").dropDatabase((err, result) => {
          if (err) throw err;
          client.close();
          res.send("complete delete successful");
        });
      });
    });

  app
    .route("/api/books/:id")
    .get((req, res) => {
      var bookid = req.params.id;
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, client) => {
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
            //.toArray();
          })
          .then(book => {
            //book = book[0];
            client
              .db("test2")
              .collection(String(book._id))
              .find({})
              .toArray((err, comments) => {
                if (err) throw err;
                delete book.commentcount;
                book.comments = comments;
                client.close();
                res.json(book);
              });
          })
          .catch(err => {
            console.log("catch", err);
            if (err) res.status(500).json({ error: err });
          });
      });
    })

    .post((req, res) => {
      var bookid = req.params.id;
      var comment = req.body.comment;
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, client) => {
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
                .find({}, {comment: 1, _id: 0})
                .toArray()
            ]);
          })
          .then(([book, comments]) => {
            book.commentcount = book.commentcount + 1;
            client
              .db("test2")
              .collection("library")
              .updateOne(
                { _id: ObjectId(book._id) },
                { $inc: { commentcount: 1 } },
                (err, result) => {
                  if (err) throw err;
                  book.comments = comments;
                  client.close();
                  res.json(book);
                }
              );
          })
          .catch(err => {
            console.log("catch", err);
            if (err) res.status(500).json({ error: err });
          });
      });
    })

    .delete((req, res) => {
      var bookid = req.params.id;
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, client) => {
        if (err) throw err;
        client
          .db("test2")
          .collection("library")
          .findOne({ _id: ObjectId(bookid) }, (err, book) => {
            if (err) throw err;
            if (!book) res.send("no book exists");
            return book;
          })
          .then(book => {
            client
              .db("test2")
              .collection("library")
              .deleteOne({ _id: ObjectId(bookid) }, (err, result) => {
                if (err) throw err;
                return result;
              });
          })
          .then(result => {
            client
              .db("test2")
              .collection(bookid)
              .drop((err, result) => {
                if (err) throw err;
                res.send("delete successful");
              });
          });
      });
    });
};
