const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { v4: uuid } = require("uuid");

const {
  checkIfUserIsAuth,
  checkIfUserIsAdmin,
} = require("../middleware/user_auth");

module.exports = function (app, pool) {
  //view Filter
  app.get("/:language/article/filter", async (req, res) => {
    let { language } = req.params;

    const data = await pool
      .query(`SELECT * FROM ${language}_filter_articles`)
      .then((rows) => {
        if (rows.length != 0) {
          console.log("view");

          res.json(rows);
        } else {
          res.sendStatus(204);
        }
      })
      .catch((err) => {
        res.sendStatus(500);
      });
  });

  //view age filter
  app.get("/:language/article/filter_age", async (req, res) => {
    let { language } = req.params;

    const data = await pool
      .query(`SELECT * FROM ${language}_filter_articles_age`)
      .then((rows) => {
        if (rows.length != 0) {
          console.log("age view");

          res.json(rows);
        } else {
          res.sendStatus(204);
        }
      })
      .catch((err) => {
        res.sendStatus(500);
      });
  });

  //add filter
  app.post(
    "/:language/article/filter/add",
    check("index").isInt(),
    check("name").notEmpty(),
    checkIfUserIsAdmin,
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
            `INSERT INTO ${language}_filter_articles (name, filter_index) VALUES (?, ?)`,
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

  //add new article
  app.post(
    "/:language/article/add",
    check("top").isInt(),
    check("bottom").isInt(),
    check("filter").isInt(),
    check("title").notEmpty(),
    check("link").notEmpty(),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let { language } = req.params;

      let top = req.body.top;
      let bottom = req.body.bottom;
      let title = req.body.title;
      let link = req.body.link;
      let filter = req.body.filter;
      let id = uuid();
      try {
        await pool
          .query(
            `INSERT INTO ${language}_articles (id, top, bottom, title, link, filter) VALUES (?,?,?,?,?,?)`,
            [id, top, bottom, title, link, filter]
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

  //view all articles
  app.get("/:language/article/view/all/:userID", async (req, res) => {
    const language = req.params.language;
    const user_id = req.params.userID;
    let article_data = {};
    let favourite_data = {};

    const article = await pool
      .query(`SELECT * FROM ${language}_articles`)
      .then((rows) => {
        if (rows.length != 0) {
          article_data = rows;
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
        `SELECT * FROM ${language}_favourite_article
          WHERE user_id = ?`,
        [user_id]
      )
      .then((rows) => {
        if (rows.length != 0) {
          favourite_data = rows;
        }
      });

    for (let index = 0; index < article_data.length; index++) {
      if (hasValueDeep(favourite_data, article_data[index]["id"])) {
        article_data[index]["isStarred"] = true;
      }
    }

    res.json(article_data);
  });

  //view only favourite articles
  app.get("/:language/article/view/favourite/:userID", async (req, res) => {
    const language = req.params.language;
    const user_id = req.params.userID;

    console.log("View only favourite article");

    console.log(user_id);
    const data = await pool
      .query(
        `SELECT ${language}_articles.*, ${language}_favourite_article.user_id
          FROM ${language}_articles, ${language}_favourite_article
          WHERE ${language}_articles.id =${language}_favourite_article.article_id AND ${language}_favourite_article.user_id=?`,
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

  //add article to Favourite
  app.post(
    "/:language/article/add_to_favourite",
    check("user_id").notEmpty(),
    check("article_id").notEmpty(),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let { language } = req.params;

      let user_id = req.body.user_id;
      let article_id = req.body.article_id;

      console.log("Add to favourite");

      try {
        await pool
          .query(
            `INSERT INTO ${language}_favourite_article (user_id, article_id) VALUES (?,?)`,
            [user_id, article_id]
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

  //Remove article from Favourite
  app.delete(
    "/:language/article/remove_from_favourite",
    check("article_id").notEmpty(),
    check("user_id").notEmpty(),
    check("language").contains(["de"]),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      let { language } = req.params;

      let article_id = req.body.article_id;
      let user_id = req.body.user_id;
      console.log("Remove from favourite");

      await pool
        .query(
          `DELETE FROM ${language}_favourite_article WHERE user_id=? AND article_id=?`,
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
