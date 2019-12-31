var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function() {
  /*
   * ----[EXAMPLE TEST]----
   * Each test should completely test the response of the API end-point including response status code!
   */
  test("#example Test GET /api/books", function(done) {
    chai
      .request(server)
      .get("/api/books")
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body, "response should be an array");
        assert.property(
          res.body[0],
          "commentcount",
          "Books in array should contain commentcount"
        );
        assert.property(
          res.body[0],
          "title",
          "Books in array should contain title"
        );
        assert.property(
          res.body[0],
          "_id",
          "Books in array should contain _id"
        );
        done();
      });
  });
  /*
   * ----[END of EXAMPLE TEST]----
   */
  var id;
  suite("Routing tests", function() {
    suite(
      "POST /api/books with title => create book object/expect book object",
      function() {
        test("Test POST /api/books with title", function(done) {
          chai
            .request(server)
            .post("/api/books")
            .send({ title: "test book" })
            .end(function(err, res) {
              assert.equal(res.status, 200);
              assert.isObject(res.body, "response should be an object");
              assert.property(res.body, "title", "should contain title");
              assert.property(res.body, "_id", "should contain _id");
              id = res.body._id;
              done();
            });
        });

        test("Test POST /api/books with no title given", function(done) {
          chai
            .request(server)
            .post("/api/books")
            .send({})
            .end(function(err, res) {
              assert.equal(res.status, 400);
              assert.isString(res.text, "response should be string");
              assert.equal(res.text, "no title inserted");
              done();
            });
        });
      }
    );

    suite("GET /api/books => array of books", function() {
      test("Test GET /api/books", function(done) {
        chai
          .request(server)
          .get("/api/books")
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body, "response should be an array");
            assert.property(
              res.body[0],
              "commentcount",
              "Books in array should contain commentcount"
            );
            assert.property(
              res.body[0],
              "title",
              "Books in array should contain title"
            );
            assert.property(
              res.body[0],
              "_id",
              "Books in array should contain _id"
            );
            done();
          });
      });
    });

    suite("GET /api/books/[id] => book object with [id]", function() {
      test("Test GET /api/books/[id] with id not in db", function(done) {
        chai
          .request(server)
          .get("/api/books/1")
          .end(function(err, res) {
            assert.equal(res.status, 404);
            assert.isString(res.text, "response should be string");
            assert.equal(res.text, "Not Found");
            done();
          });
      });

      test("Test GET /api/books/[id] with valid id in db", function(done) {
        chai
          .request(server)
          .get("/api/books/" + id)
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body, "response should be an object");
            assert.property(res.body, "title", "body should contain title");
            assert.property(res.body, "_id", "body should contain _id");
            done();
          });
      });
    });

    suite(
      "POST /api/books/[id] => add comment/expect book object with id",
      function() {
        test("Test POST /api/books/[id] with comment", function(done) {
          chai
            .request(server)
            .post("/api/books/" + id)
            .send({ comment: "test comment" })
            .end(function(err, res) {
              assert.equal(res.status, 200);
              assert.isObject(res.body, "response should be an object");
              assert.property(res.body, "title", "body should contain title");
              assert.property(res.body, "_id", "body should contain _id");
              done();
            });
        });
      }
    );
  });
});
