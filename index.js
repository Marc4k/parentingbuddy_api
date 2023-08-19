/*
require("dotenv").config();

var admin = require("firebase-admin");
const serverless = require("serverless-http");
let AWS = require("aws-sdk");
var mysql2 = require("mysql2");



app.use(express.json());

/*
const {
  checkIfUserIsAuth,
  checkIfUserIsAdmin,
} = require("./middleware/user_auth");*/

//app.use(checkIfUserIsAuth);
/*
const connection = mysql2.createConnection({
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  connectionLimit: 5,
});

console.log(connection);

require("./routes/kid")(app, pool);
require("./routes/user")(app, pool);
require("./routes/article")(app, pool);
require("./routes/podcast")(app, pool);
require("./routes/timeline")(app, pool);
require("./routes/div")(app, pool);

app.listen(3000, () => console.log(`Listening on: 3000`));
//module.exports.handler = serverless(app);
*/
const mysql = require("mysql2/promise");
const AWS = require("aws-sdk");
const dotenv = require("dotenv");
const express = require("express");
dotenv.config();

const app = express();
// Create an RDS proxy object
const rds = new AWS.RDS();
const proxyParams = {
  DBProxyName: "parentingbuddy", // your proxy name here
  VpcSubnetIds: [
    "subnet-0ad6a90a0ac754428",
    "subnet-0a6195af360fefa42",
    "subnet-01560e2f4bb0475dd",
  ],
  DBProxyEndpointName: "parentingbuddyp",
};

async function createProxyEndpoint() {
  const proxyEndpoint = await rds.createDBProxyEndpoint(proxyParams).promise();
  return proxyEndpoint;
}

// Create a database connection
async function createConnection() {
  const proxyEndpoint = await createProxyEndpoint();
  const connection = await mysql.createConnection({
    host: proxyEndpoint.Endpoint,
    port: proxyEndpoint.Port,
    user: "admin",
    password: "74hydKNFi7bRgqRTiKC7NswD6DLV2m",
    database: "parentingbuddy_db",
    ssl: "Amazon RDS",
    authPlugins: {
      mysql_clear_password: () => () =>
        Buffer.from("74hydKNFi7bRgqRTiKC7NswD6DLV2m + \0"),
    },
  });
  return connection;
}

// Test the connection
createConnection().then((connection) => {
  connection.connect((err) => {
    if (err) {
      console.error("Failed to connect to RDS Proxy:", err);
    } else {
      console.log("Connected to RDS Proxy");
    }
  });
});

// Define a route to query the database

// Start the server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
