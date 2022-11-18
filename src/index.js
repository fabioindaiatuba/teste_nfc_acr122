const open = require("open");

const http = require("./app");
const PORT = 4000;

http.listen(PORT, async () => {
  console.log(`Server on: http://localhost:${PORT}`);
  //await open(`http://localhost:${PORT}`);
});
