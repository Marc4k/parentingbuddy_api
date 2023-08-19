const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { v4: uuid } = require("uuid");

module.exports = function (app, pool) {
  app.get("/:language/timeline/category", async (req, res) => {
    let { language } = req.params;
    console.log("view timeline category");
    const data = await pool
      .query(`SELECT * FROM ${language}_category_timeline`)
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

  app.post(
    "/:language/timeline/category/add",

    check("is_active").isInt(),
    check("name").notEmpty(),
    check("description").notEmpty(),
    check("isPremium").isInt(),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let { language } = req.params;
      let is_active = req.body.is_active;
      let name = req.body.name;
      let description = req.body.description;
      let isPremium = req.body.isPremium;
      const id = uuid();
      try {
        await pool
          .query(
            `INSERT INTO ${language}_category_timeline (id, is_active, description, isPremium, name) VALUES (?,?,?,?,?)`,
            [id, is_active, description, isPremium, name]
          )
          .then((result) => {
            if (result.affectedRows == 1) {
              res.sendStatus(201);
            } else {
              res.sendStatus(500);
            }
          });
      } catch (error) {
        res.sendStatus(500);
      }
    }
  );

  app.get("/:language/timeline", async (req, res) => {
    let { language } = req.params;
    console.log("view timeline");
    const data = await pool
      .query(`SELECT * FROM ${language}_timeline`)
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

  app.post(
    "/:language/timeline/add",

    check("isTitle").isInt(),
    check("title").notEmpty(),
    check("category").isInt(),

    check("id_sorting").isInt(),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let { language } = req.params;

      let id_sorting = req.body.id_sorting;

      let bottomValue = req.body.bottomValue;
      let topValue = req.body.topValue;
      let infos = req.body.infos;
      let isTitle = req.body.isTitle;
      let title = req.body.title;
      let category = req.body.category;
      const id = uuid();

      if (bottomValue == undefined) {
        bottomValue = null;
      }
      if (topValue == undefined) {
        topValue = null;
      }
      if (infos == undefined) {
        infos = null;
      }

      try {
        await pool
          .query(
            `INSERT INTO ${language}_timeline (id, id_sorting, bottomValue, topValue, infos, isTitle, title, category) VALUES (?,?,?,?,?,?,?,?)`,
            [
              id,
              id_sorting,
              bottomValue,
              topValue,
              infos,
              isTitle,
              title,
              category,
            ]
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
};
