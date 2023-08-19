const { auth } = require("firebase-admin");
var admin = require("firebase-admin");

module.exports = {
  checkIfUserIsAuth,
  checkIfUserIsAdmin,
};

function checkIfUserIsAuth(req, res, next) {
  let authToken = "";
  console.log("checkIfUserIsAuth");
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    authToken = req.headers.authorization.split(" ")[1];
  } else {
    return res.sendStatus(401);
  }
  if (admin.auth().verifyIdToken(authToken)) {
    return next();
  } else {
    res.sendStatus(401);
  }
}

function checkIfUserIsAdmin(req, res, next) {
  let authToken = "";
  console.log("checkIfUserIsAdmin");

  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    authToken = req.headers.authorization.split(" ")[1];
  } else {
    return res.sendStatus(401);
  }
  if (admin.auth().verifyIdToken(authToken)) {
    admin
      .auth()
      .verifyIdToken(authToken)
      .then((decodedToken) => {
        // The user ID is contained in the decoded token
        const userId = decodedToken.uid;
        const email = decodedToken.email;

        if (
          userId == "CTGIuEo1eDdxbXoMP03H2pLTICI2" &&
          email == "marc.jenni10@proton.me"
        ) {
          return next();
        }
      });

    res.sendStatus(401);
  } else {
    res.sendStatus(401);
  }
}
