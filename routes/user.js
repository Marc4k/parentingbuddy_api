const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

module.exports = function (app, pool) {
  //create user
  app.post(
    "/user/create",
    check("user_id").notEmpty(),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let user_id = req.body.user_id;
      try {
        await pool
          .query("INSERT INTO user_data (user_id) VALUES (?)", [user_id])
          .then((result) => {
            if (result.affectedRows == 1) {
              res.sendStatus(201);
            } else {
              res.sendStatus(500);
            }
          });
      } catch (error) {
        if ((error.errno = 1062)) {
          res.sendStatus(208);
        } else {
          res.sendStatus(500);
        }
      }
    }
  );

  app.get("/user/:userid", async (req, res) => {
    let { userid } = req.params;

    const data = await pool
      .query("SELECT * FROM user_data WHERE user_id=?", [userid])
      .then((rows) => {
        if (rows.length != 0) {
          res.json(rows);
        } else {
          res.sendStatus(204);
        }
      })
      .catch((err) => {
        res.sendStatus(500);
      });
  });

  //increase
  app.put("/user/increase_question_count/:userid", async (req, res) => {
    let { userid } = req.params;
    console.log(userid);
    let currentQuestionCount = 0;

    const data = await pool
      .query("SELECT * FROM user_data WHERE user_id=?", [userid])
      .then((result) => {
        currentQuestionCount = result[0]["question_count"];
      })
      .catch((err) => {
        return res.sendStatus(500);
      });

    await pool
      .query("UPDATE user_data SET question_count=? WHERE user_id=?", [
        ++currentQuestionCount,
        userid,
      ])
      .then((result) => {
        if (result.affectedRows == 1) {
          return res.sendStatus(201);
        } else {
          return res.sendStatus(500);
        }
      });
  });

  app.put("/user/set_member_date/:userid", async (req, res) => {
    let { userid } = req.params;

    var dateTime = new Date();

    await pool
      .query("UPDATE user_data SET member_since=? WHERE user_id=?", [
        dateTime,
        userid,
      ])
      .then((result) => {
        console.log(result);
        if (result.affectedRows == 1) {
          return res.sendStatus(201);
        } else {
          return res.sendStatus(400);
        }
      })
      .catch((err) => {
        return res.sendStatus(500);
      });
  });
};
