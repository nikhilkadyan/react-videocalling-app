require('dotenv').config();
const express = require("express");
const socket = require("socket.io");
const app = express();
app.set('port', process.env.PORT || 4000);

// Import routes
require('./modules/routes.js')(app);

// Start http/https Server
let server = require('./modules/https.js')(app);
server.listen(app.get('port'), () => {
    console.log("Server started on port " + app.get('port'));
});

// Import Sockets
const io = socket(server);
require('./modules/sockets')(io);
