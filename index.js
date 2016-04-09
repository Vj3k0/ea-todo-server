'use strict';
const fs = require('fs');
const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const isDevelopment = process.env.NODE_ENV === 'development';

// Fetch manifest info every 5 minutes
const FETCH_INTERVAL = 300000;

var manifest = null;

app.use(require('morgan')('dev'));

if (isDevelopment) {
    app.use('/updates/releases', express.static(path.join(__dirname, 'updates/releases')));
}

app.get('/updates/latest', (req, res) => {
    if (manifest) {
        const latest = manifest.version;
        const clientVersion = req.query.v;

        if (clientVersion === latest) {
            res.status(204).end();
        } else {
            res.json({
                name: manifest.name,
                url: `${getBaseUrl()}/updates/releases/osx/eatodo-${latest}-mac.zip`,
                notes: manifest.notes,
                pub_date: manifest.pub_date
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

let getManifest = () => {
    console.log(`Checking manifest from ${manifestUrl}`);
    http.get(manifestUrl, function(res){
        var body = '';

        res.on('data', function(chunk){
            body += chunk;
        });

        res.on('end', function(){
            var remoteManifest = JSON.parse(body);
            if (!manifest || manifest.version !== remoteManifest.version) {
                manifest = remoteManifest;
                console.log(`Manifest loaded - latest v${manifest.version}`);
            }
        });
    }).on('error', function(e){
        console.log("Got an error: ", e);
    });
    
    setTimeout(getManifest, FETCH_INTERVAL);
}

const manifestUrl = `${getBaseUrl()}/updates/releases/osx/manifest.json`;
getManifest();

app.listen(process.env.PORT, () => {
  console.log(`Express server listening on port ${process.env.PORT}`);
});