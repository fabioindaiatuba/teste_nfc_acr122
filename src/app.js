const express = require("express");
const cors = require("cors");
require("./service/read");
const routes = require("./routes");

class App {
  constructor() {
    this.http = express();

    this.middleware();
    this.routes();
  }

  middleware() {
    this.http.use(cors());
    this.http.use(express.json());
  }

  routes() {
    this.http.use(routes);
  }
}

module.exports = new App().http;
