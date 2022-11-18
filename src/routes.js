const { Router, static } = require("express");
const path = require("path");

const routes = new Router();

routes.get("/", (req, res) => {
  res.contentType("text/html");
  res.sendFile(path.join(__dirname, "./www/index.html"));
});

// endpoint to serve web assets
routes.use("/web", static(path.join(__dirname, "./www")));

module.exports = routes;
