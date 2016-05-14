'use strict';
const express = require('express');
const path = require('path');
const app = express();
const request = require('request');
const isDevelopment = process.env.NODE_ENV === 'development';

var version;
// Fetch manifest info every 5 minutes
const FETCH_INTERVAL = 300000;

app.use(require('morgan')('dev'));

if (isDevelopment) {
    app.use('/updates/latest', express.static(path.join(__dirname, 'updates/latest')));
}

app.get('/updates/latest', (req, res) => {
    if (version) {
        const clientVersion = req.query.v;

        if (clientVersion === version) {
            res.status(204).end();
        } else {
            res.json({
                url: `${getBaseUrl()}/updates/latest/osx/eatodo-${version}-mac.zip`
            });
        }
    }
    else {
        res.status(204).end();
    }
});

let getBaseUrl = () => {
    if (isDevelopment) {
        return 'http://localhost:3000';
    } else {
        return 'http://eatodo.s3.amazonaws.com'
    }
}

let getVersion = () => {
    console.log(`Fetching latest version from ${versionUrl}`);
    request.get(versionUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            version = body;
        }
        else if (error) {
            console.error(error);
        }
    });
    
    setTimeout(getVersion, FETCH_INTERVAL);
}

const versionUrl = `${getBaseUrl()}/updates/latest/osx/VERSION`;
getVersion();

app.listen(process.env.PORT, () => {
    console.log(`Express server listening on port ${process.env.PORT}`);
});
