module.exports = function (app) {
    let server;
    if(process.env.ENVIROMENT == 'DEBUG'){
        const http = require("http");
        server = http.createServer(app);
    } else {
        const https = require('https');
        const fs = require('fs');
        // https Certificate
        const key = fs.readFileSync(__dirname + '/../certificates/privkey.pem');
        const cert = fs.readFileSync(__dirname + '/../certificates/fullchain.pem');
        const options = {
            key: key,
            cert: cert
        };
        server = https.createServer(options, app);
    }

    return server;
}