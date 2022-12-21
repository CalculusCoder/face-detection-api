const express = require("express");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const app = express();
const knex = require("knex");
app.use(express.json());
app.use(cors());

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    user: "postgres",
    password: "Emanuel12",
    database: "smart-brain",
  },
});

app.get("/", (req, res) => {
  res.send("Success");
});

app.post("/signin", (req, res) => {
  db.select("email", "hash")
    .from("login")
    .where("email", "=", req.body.email)
    .then((data) => {
      const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
      if (isValid === true) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", req.body.email)
          .then((user) => {
            console.log(user);
            res.json(user[0]);
          })
          .catch((err) => res.json("err"));
      } else {
        res.status(400).json("wrong credentials");
      }
    })
    .catch((err) => res.json("err wrong credentials"));
});

app.post("/register", (req, res) => {
  const hash = bcrypt.hashSync(req.body.password);
  db.transaction((trx) => {
    trx
      .insert({
        hash: hash,
        email: req.body.email,
      })
      .into("login")
      .returning("email")
      .then((logInEmail) => {
        return trx("users")
          .returning("*")
          .insert({
            email: logInEmail[0].email,
            name: req.body.name,
          })
          .then((user) => {
            res.json(user[0]);
          })
          .then(trx.commit)
          .catch(trx.rollback);
      });
  }).catch((err) => res.json(err));
});

app.get("/profile/:id", (req, res) => {
  const { id } = req.params;
  db.select("*")
    .from("users")
    .where({ id: id })
    .then((user) => res.json(user[0]));
});

app.put("/image", (req, res) => {
  const { id } = req.body;
  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then((entries) => {
      res.json(entries[0].entries);
    })
    .catch((err) => res.json("err"));
});

app.listen(3000);
