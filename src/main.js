const express = require("express");
const app = express();
const fs = require("fs");
const ejs = require("ejs");
const path = require('path');

app.set("view engine", "ejs");

app.use("/assets", express.static("assets"));

app.use((req, res, next) => {
  if (req.path.endsWith("/index.html")) {
    const newPath = req.path.slice(0, -10);
    res.redirect(newPath);
  } else {
    next();
  }
});

app.get("/:uri?", (req, res) => {
  const uri = req.params.uri || "index.html";
  page(uri, (content) => {
    if (content) {
      res.send(content);
    } else {
      errorPage(404, (content) => {
        res.status(404).send(content);
      });
    }
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

function getDirectories(baseDir) {
  return fs.readdirSync(baseDir).reduce((dirs, file) => {
    if (file !== 'views' && file !== 'assets') {
      let fullPath = path.join(baseDir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        dirs[file] = getDirectories(fullPath);  // Recursively get subdirectories
      }
    }
    return dirs;
  }, {});
}

function page(uri, callback) {
  uri = uri === '/' ? 'index.html' : uri;
  let filePath = uri.endsWith('.html') ? `public/${uri}` : `public/${uri}/index.html`;
  if (fs.existsSync(filePath)) {
    let html = fs.readFileSync(filePath, 'utf8');
    let dirs = getDirectories('public');
    ejs.renderFile('public/views/layout.ejs', { body: html, dirs: dirs }, (err, renderedHtml) => {
      if (err) {
        console.log(err)
        callback(null);
      } else {
        callback(renderedHtml);
      }
    });
  } else {
    callback(null);
  }
}

function errorPage(error, callback) {
  let filePath = `error_pages/${error}.html`;
  if (fs.existsSync(filePath)) {
    let html = fs.readFileSync(filePath, 'utf8');
    let dirs = getDirectories('public');
    ejs.renderFile('public/views/layout.ejs', { body: html, dirs: dirs }, (err, renderedHtml) => {
      if (err) {
        console.log(err)
        callback('Error page not found');
      } else {
        callback(renderedHtml);
      }
    });
  } else {
    callback('Error page not found');
  }
}
