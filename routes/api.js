"use strict";

const expect = require("chai").expect;
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const MONGODB_CONNECTION_STRING = process.env.MLAB_URI;

module.exports = app => {
  app
    .route("/api/books")
    .get((req, res) => {
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if (err) throw err;
        db.db("test2")
          .collection("library")
          .find({})
          .toArray((err, books) => {
            if (err) throw err;
            db.close();
            res.json(books);
          });
      });
    })

    .post((req, res) => {
      var title = req.body.title;
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if (err) throw err;
        db.db("test2")
          .collection("library")
          .insertOne(
            { title: req.body.title, commentcount: 0 },
            (err, book) => {
              if (err) throw err;
              db.close();
              res.json({ title: book.title, _id: book._id });
            }
          );
      });
    })

    .delete((req, res) => {
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if (err) throw err;
        db.db("test2").dropDatabase((err, result) => {
          if (err) throw err;
          db.close();
          res.send("complete delete successful");
        });
      });
    });

  app
    .route("/api/books/:id")
    .get((req, res) => {
      var bookid = req.params.id;
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if (err) throw err;
        db.db("test2")
          .collection("library")
          .findOne({ _id: bookid }, (err, book) => {
            if (err) throw err;
            if (!book) res.send("no book exists");
            console.log(book);
            return book;
          })
          .then(book => {
            db.db("test2")
              .collection("library")
              .find({ _id: ObjectId(bookid) }, (err, book) => {
                if (err) throw err;
                return book;
              });
          })
          .then(book => {
            db.db("test2")
              .collection(book._id)
              .find({})
              .toArray((err, comments) => {
                if (err) throw err;
                book.comments = comments;
                db.close();
                res.json(book);
              });
          });
      });
    })

    .post((req, res) => {
      var bookid = req.params.id;
      var comment = req.body.comment;
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if (err) throw err;
        db.db("test2")
          .collection("library")
          .findOne({ _id: ObjectId(bookid) }, (err, book) => {
            if (err) throw err;
            if (!book) res.send("no book exists");
            return book;
          })
          .then(book => {
            db.db("test2")
              .collection(bookid)
              .insertOne({ comment }, (err, result) => {
                if (err) throw err;
                return result;
              });
          })
          .then(result => {
            return db
              .db("test2")
              .collection("library")
              .find({ _id: ObjectId(bookid) }, (err, book) => {
                if (err) throw err;
                return book;
              });
          })
          .then((err, book) => {
            if (err) throw err;
            db.db("test2")
              .collection(book._id)
              .find({})
              .toArray((err, comments) => {
                if (err) throw err;
                book.comments = comments;
                db.close();
                res.json(book);
              });
          });
        //.catch(err => console.log(err));
      });
    })

    .delete((req, res) => {
      var bookid = req.params.id;
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, db) => {
        if (err) throw err;
        db.db("test2")
          .collection("library")
          .findOne({ _id: ObjectId(bookid) }, (err, book) => {
            if (err) throw err;
            if (!book) res.send("no book exists");
            return book;
          })
          .then(book => {
            db.db("test2")
              .collection("library")
              .deleteOne({ _id: ObjectId(bookid) }, (err, result) => {
                if (err) throw err;
                return result;
              });
          })
          .then(result => {
            db.db("test2")
              .collection(bookid)
              .drop((err, result) => {
                if (err) throw err;
                res.send("delete successful");
              });
          });
      });
    });
};
