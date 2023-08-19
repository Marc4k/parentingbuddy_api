const express = require("express");
const router = express.Router();
const { v4: uuid } = require("uuid");
const multer = require("multer");
const { check, validationResult } = require("express-validator");

const { s3DeleteV3 } = require("../s3Service");
const { uploadImage } = require("../upload-service");

module.exports = function (app, pool) {
  app.get("/kid/:userid", async (req, res) => {
    let { userid } = req.params;
    console.log("Kid/view");
    console.log("Kid/view");
    const data = await pool
      .query("SELECT * FROM kids_data WHERE user_id=?", [userid])
      .then((rows) => {
        console.log(rows[0].user_id);
        res.json(rows);
      })
      .catch((err) => {
        res.sendStatus(204);
      });
  });
  const upload = multer({ limits: { fileSize: 5000000, files: 1 } });
  app.post(
    "/kid/add",

    upload.single("profil"),

    async (req, res) => {
      console.log("Kid/add");
      let userId = req.body.userid;
      let kidname = req.body.kidname;
      let birthday = req.body.birthday;
      let kid_id = uuid();

      if (userId && kidname && birthday) {
        let picture_url = "NoPicture";

        if (req.file) {
          const link = await uploadImage(
            `nonhifyvsj5cp26e1936jmqz6-kid/${kid_id}.jpeg`,
            req.file.buffer
          );

          if (link == "no-upload") {
            return res.sendStatus(500);
          } else {
            picture_url = link;
          }
        }

        await pool
          .query(
            "INSERT INTO kids_data (user_id, kid_id ,kidname,picture_url,birthday ) VALUES (?,?,?,?,?)",
            [userId, kid_id, kidname, picture_url, birthday]
          )
          .then((result) => {
            if (result.affectedRows == 1) {
              return res.sendStatus(201);
            } else {
              res.status(500);
            }
          });
      } else {
        return res.sendStatus(400);
      }
    }
  );

  //Edit a kid
  app.put(
    "/kid/edit/:name",

    check("newData").notEmpty(),
    check("kid_id").isUUID(),
    check("name").isIn(["kidname", "picture_url", "birthday"]),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let { name } = req.params;
      let newData = req.body.newData;
      let kid_id = req.body.kid_id;

      await pool
        .query("UPDATE kids_data SET " + name + "=? WHERE kid_id=?", [
          newData,
          kid_id,
        ])
        .then((result) => {
          if (result.affectedRows == 1) {
            console.log(result);
            res.sendStatus(201);
          } else {
            res.sendStatus(500);
          }
        });
    }
  );

  //Delete a kid
  app.delete(
    "/kid/delete/:kid_id",

    check("kid_id").isUUID(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let { kid_id } = req.params;
      const path = `nonhifyvsj5cp26e1936jmqz6-kid/${kid_id}.jpeg`;
      const results = await s3DeleteV3(path);
      await pool
        .query("DELETE FROM kids_data WHERE kid_id=?", [kid_id])
        .then((result) => {
          if (result.affectedRows == 1) {
            console.log(result);
            res.sendStatus(201);
          } else {
            res.sendStatus(500);
          }
        });
    }
  );

  //Delete a kid
  app.put(
    "/kid/change_picture/:kid_id",
    upload.single("profil"),
    check("kid_id").isUUID(),
    check("picture_url").notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let { kid_id } = req.params;
      let picture_url = req.body.picture_url;
      const path = `nonhifyvsj5cp26e1936jmqz6-kid/${kid_id}.jpeg`;
      let link = "";
      if (req.file) {
        console.log(picture_url);
        if (picture_url == "NoPicture") {
          await pool
            .query("UPDATE kids_data SET picture_url=? WHERE kid_id=?", [
              link,
              kid_id,
            ])
            .then((result) => {
              if (result.affectedRows == 1) {
                console.log(result);
              } else {
                return res.sendStatus(500);
              }
            });
        }
        link = await uploadImage(
          `nonhifyvsj5cp26e1936jmqz6-kid/${kid_id}.jpeg`,
          req.file.buffer
        );

        if (link == "no-upload") {
          return res.sendStatus(500);
        } else {
          return res.sendStatus(201);
        }
      } else {
        return res.sendStatus(400);
      }
    }
  );

  app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "file_too_large",
        });
      }

      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          message: "file_is_no_image",
        });
      }
    }
  });
};
