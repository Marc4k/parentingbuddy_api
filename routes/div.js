const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

module.exports = function (app, pool) {
  app.get("/:language/getDataTimes", async (req, res) => {
    let { language } = req.params;
    console.log("get data");
    const data = await pool
      .query(`SELECT * FROM ${language}_new_data`)
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
};
