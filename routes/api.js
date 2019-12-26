"use strict";

const expect = require("chai").expect;
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const MONGODB_CONNECTION_STRING = process.env.MLAB_URI;

module.exports = function(app) {
  app
    .route("/api/books")
    .get(function(req, res) {
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        if (err) throw err;
        db.db("test2")
          .collection("library")
          .find({})
          .toArray((err, books) => {
            if (err) throw err;
            res.json(books);
          });
      });
    })

    .post(function(req, res) {
      var title = req.body.title;
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        if (err) throw err;
        db.db("test2")
          .collection("library")
          .insertOne({ title: req.body.title }, (err, book) => {
            if (err) throw err;
            res.json({ title: book.title, _id: book._id });
          });
      });
    })

    .delete(function(req, res) {
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        if (err) throw err;
        db.db("test2")
          .collection("library")
          .delete({ }, (err, book) => {
            if (err) throw err;
            res.json({ title: book.title, _id: book._id });
          });
      });
    });

  app
    .route("/api/books/:id")
    .get(function(req, res) {
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    })

    .post(function(req, res) {
      var bookid = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get
    })

    .delete(function(req, res) {
      var bookid = req.params.id;
      //if successful response will be 'delete successful'
    });
};
