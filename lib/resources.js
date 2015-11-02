'use strict';

const path = require('path');
const fs   = require('fs');

module.exports = class {
  constructor(dataConfig) {
    this._dataConfig = dataConfig;

    let dir = dataConfig.directory;
    if(!path.isAbsolute(dir)) {
      // relative to base
      dir = path.join(__dirname, '..', dir);
    }
    dir = path.normalize(dir);
    this._directory = dir;
    try {
     fs.accessSync(dir, fs.R_OK | fs.W_OK);
    } catch(err) {
      fs.mkdirSync(dir, 0o755);
    }
  }

  keys() {

  }

  get(key) {

  }

  set(key, value) {

  }
}