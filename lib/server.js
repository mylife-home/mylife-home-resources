'use strict';

const EventEmitter = require('events');
const os           = require('os');
const async        = require('async');
const common       = require('mylife-home-common');
const Resources    = require('./resources');

module.exports = class {
  constructor(config) {
    const netConfig        = config.net;
    this._netConfig        = netConfig;
    this._resources        = new Resources(config.data);
    this._adminClient      = new common.admin.Client(netConfig, this._adminNick(), this._createAdminDefinition());
    this._uiClient         = new common.net.Client(netConfig, netConfig.resources_nick);
    this._adminExecutor    = new common.net.jpacket.Executor(this._adminClient); // writable
    this._uiExecutor       = new common.net.jpacket.Executor(this._uiClient); // read-only

    this._adminExecutor.on('enum',    this._executeResourcesEnum.bind(this));
    this._adminExecutor.on('get',     this._executeResourcesGet.bind(this));
    this._adminExecutor.on('hash',    this._executeResourcesHash.bind(this));
    this._adminExecutor.on('set',     this._executeResourcesSet.bind(this));
    this._adminExecutor.on('sysinfo', this._executeSysInfo.bind(this));

    this._uiExecutor.on('enum', this._executeResourcesEnum.bind(this));
    this._uiExecutor.on('get',  this._executeResourcesGet.bind(this));
    this._uiExecutor.on('hash', this._executeResourcesHash.bind(this));
  }

  _adminNick() {
    return 'mylife-home-resources_' + os.hostname().split('.')[0];
  }

  _createAdminDefinition() {
    const self = this;
    return {
      resources: {
        desc: 'Resources management',
        children: {
          list: {
            desc: 'List resources',
            impl: (w) => {
              w('Resources list:');
              for(let key of self._resources.keys()) {
                const size = self._resources.get(key).length;
                w('Key: ' + key + ', size: ' + size);
              }
              w('---');
            }
          },
          delete: {
            desc: 'Delete a resource by key',
            impl: (w, m) => {
              if(!m || m === '') { return w('No key provided'); }
              const exists = self._resources.get(m);
              if(!exists) { return w('Key not found: ' + m); }
              self._resources.set(m);
              w('Resource with key ' + m + ' deleted');
            }
          }
        }
      },
      system: common.admin.SysInfo.definition
    };
  }

  _executeResourcesEnum(req, cb) {
    const factory = common.net.jpacket.Factory;
    const keys = this._resources.keys();
    return setImmediate(cb, undefined, factory.createResourcesEnum(keys));
  }

  _executeResourcesGet(req, cb) {
    const factory = common.net.jpacket.Factory;
    const value = this._resources.get(req.key);
    if(!value) { return cb(new Error('no such resource')); }
    return setImmediate(cb, undefined, factory.createResourcesGet(value));
  }

  _executeResourcesHash(req, cb) {
    const factory = common.net.jpacket.Factory;
    const data = {};
    for(const key of req.keys) {
      const hash = data[key] = this._resources.hash(req.key);
      if(!hash) { return cb(new Error(`no such resource : '${key}'`)); }
    }
    return setImmediate(cb, undefined, factory.createResourcesHash(value));
  }

  _executeResourcesSet(req, cb) {
    const factory = common.net.jpacket.Factory;
    this._resources.set(req.key, req.value);
    return setImmediate(cb, undefined, factory.createSuccess());
  }

  _executeSysInfo(req, cb) {
    const factory = common.net.jpacket.Factory;
    common.admin.SysInfo.getInfo((err, res) => {
      if(err) { return cb(err); }
      setImmediate(cb, undefined, factory.createSysInfo(res));
    });
  }

  close(cb) {
    async.parallel([
      (cb) => this._uiClient.close(cb),
      (cb) => this._adminClient.close(cb)
    ], cb);
  }
};