'use strict';

// TODO: cached version
// TODO: async version with operations queue

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
    return fs.readdirSync(this._directory);
  }

  get(key) {
    const file = path.join(this._directory, key);
    return fs.readFileSync(file, 'utf8');
  }

  set(key, value) {
    const file = path.join(this._directory, key);
    if(value === undefined || value === null || value === '') {
      fs.unlinkSync(file);
      return;
    }
    fs.writeFileSync(file, value, { mode : 0o644 });
  }
};