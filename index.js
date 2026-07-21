const path = require("path");
const serverFile = path.join(__dirname, "apps", "web", ".next", "standalone", "server.js");

process.env.HOSTNAME = "0.0.0.0";
require(serverFile);
