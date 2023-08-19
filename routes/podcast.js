const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { v4: uuid } = require("uuid");

module.exports = function (app, pool) {
  app.get("/:language/podcast/filter", async (req, res) => {
    let { language } = req.params;
    console.log("view Podcast filter");
    const data = await pool
      .query(`SELECT * FROM ${language}_filter_podcast`)
      .then((rows) => {
        if (rows.length != 0) {
          console.log("view podcast filter");

          res.json(rows);
        } else {
          res.sendStatus(204);
        }
      })
      .catch((err) => {
        res.sendStatus(500);
      });
  });

  app.post(
    "/:language/podcast/filter/add",
    check("index").isInt(),
    check("name").notEmpty(),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let { language } = req.params;
      let index = req.body.index;
      let name = req.body.name;

      try {
        await pool
          .query(
            `INSERT INTO ${language}_filter_podcast (name, podcast_index) VALUES (?, ?)`,
            [name, index]
          )
          .then((result) => {
            if (result.affectedRows == 1) {
              res.sendStatus(201);
            } else {
              res.sendStatus(500);
            }
          });
      } catch (error) {
        console.log(error);
        if (error.errno == 1062) {
          res.sendStatus(208);
        } else {
          res.sendStatus(500);
        }
      }
    }
  );

  app.get("/:language/podcast/view/all/:userID", async (req, res) => {
    const language = req.params.language;
    const user_id = req.params.userID;
    let podcast_data = {};
    let favourite_data = {};

    const article = await pool
      .query(`SELECT * FROM ${language}_podcast`)
      .then((rows) => {
        if (rows.length != 0) {
          podcast_data = rows;
        } else {
          res.sendStatus(204);
        }
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });

    const favourite = await pool
      .query(
        `SELECT * FROM ${language}_favourite_podcast
          WHERE user_id = ?`,
        [user_id]
      )
      .then((rows) => {
        if (rows.length != 0) {
          favourite_data = rows;
        }
      });

    for (let index = 0; index < podcast_data.length; index++) {
      if (hasValueDeep(favourite_data, podcast_data[index]["id"])) {
        podcast_data[index]["isStarred"] = true;
      }
    }

    res.json(podcast_data);
  });

  app.post(
    "/:language/podcast/add_to_favourite",
    check("user_id").notEmpty(),
    check("podcast_id").notEmpty(),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let { language } = req.params;

      let user_id = req.body.user_id;
      let podcast_id = req.body.podcast_id;

      console.log("Add to favourite");

      try {
        await pool
          .query(
            `INSERT INTO ${language}_favourite_podcast (user_id, podcast_id) VALUES (?,?)`,
            [user_id, podcast_id]
          )
          .then((result) => {
            if (result.affectedRows == 1) {
              res.sendStatus(201);
            } else {
              res.sendStatus(500);
            }
          });
      } catch (error) {
        console.log(error);
        res.sendStatus(500);
      }
    }
  );

  app.delete(
    "/:language/podcast/remove_from_favourite",
    check("podcast_id").notEmpty(),
    check("user_id").notEmpty(),
    check("language").contains(["de"]),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      let { language } = req.params;

      let article_id = req.body.podcast_id;
      let user_id = req.body.user_id;
      console.log("Remove from favourite Podcast");

      await pool
        .query(
          `DELETE FROM ${language}_favourite_podcast WHERE user_id=? AND podcast_id=?`,
          [user_id, article_id]
        )
        .then((result) => {
          if (result.affectedRows == 1) {
            console.log(result);
            res.sendStatus(201);
          } else {
            res.sendStatus(204);
          }
        })
        .catch((err) => {
          res.sendStatus(500);
        });
    }
  );

  app.get("/:language/podcast/view/favourite/:userID", async (req, res) => {
    const language = req.params.language;
    const user_id = req.params.userID;

    console.log("View only favourite podcast");

    console.log(user_id);
    const data = await pool
      .query(
        `SELECT ${language}_podcast.*, ${language}_favourite_podcast.user_id
          FROM ${language}_podcast, ${language}_favourite_podcast
          WHERE ${language}_podcast.id =${language}_favourite_podcast.podcast_id AND ${language}_favourite_podcast.user_id=?`,
        [user_id]
      )
      .then((rows) => {
        if (rows.length != 0) {
          console.log("view");

          res.json(rows);
        } else {
          res.sendStatus(204);
        }
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  });
};

function hasValueDeep(json, findValue) {
  const values = Object.values(json);
  let hasValue = values.includes(findValue);
  values.forEach(function (value) {
    if (typeof value === "object") {
      hasValue = hasValue || hasValueDeep(value, findValue);
    }
  });
  return hasValue;
}
