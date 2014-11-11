/* jshint node:true */

var _ = require('underscore');
var async = require('async');
var LineReader = require('./lineReader.js');
var Logger = require('pince');

/**
 * LineWorker
 *
 * @param readStream `Readable` stream to process
 * @param worker function(data, done) to call for each piece of data.  Call done() when
 * done, with optional error argument.
 * @param options {concurrency:Integer, maxQueueSize:Integer, minQueueSize:Integer}
 * @param callback function(error) Called when all items are processed, or with an
 * error if an error occurs.
 */
var LineWorker = function (readStream, worker, options, callback) {
  if (!(this instanceof LineWorker)) {
    return new LineWorker(readStream, worker, options, callback);
  }
  var self = this;
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  self.callback = callback || function () {};

  var defaults = {
    concurrency: 5,
    minQueueSize: 5,
    maxQueueSize: 20,
    maxLines: null,
  };

  self.options = _.extend({}, defaults, options);

  self.lineReader = new LineReader(readStream, self.options);
  self.queue = async.queue(worker, self.options.concurrency);
  self.log = new Logger('LineWorker');
  if (self.options.logLevel) Logger.setLevel('LineWorker', self.options.logLevel);
};

LineWorker.prototype.canRead = function () {
  return this.lineReader.readable &&
    this.queue.length() < this.options.maxQueueSize;
};

LineWorker.prototype.isDone = function () {
  return this.lineReader.finished() &&
    this.queue.length() === 0 &&
    this.queue.running() === 0;
};

LineWorker.prototype.enqueueTasks = function () {
  this.log.debug('enqueuing tasks');
  while (this.canRead()) {
    var task = this.lineReader.readLine();
    if (task) {
      this.log.trace('enqueuing', task);
      this.queue.push(task);
    }
  }
};


LineWorker.prototype.start = function () {
  var self = this;
  self.lineReader.on('readable', function () {
    self.enqueueTasks();
  });

  self.lineReader.on('error', function (error) {
    self.callback(error);
  });

  self.queue.empty = function () {
    // Poor man's binding
    self.enqueueTasks();
  };

  self.queue.drain = function () {
    if (self.isDone()) self.callback();
  };

  if (self.lineReader.readable) {
    self.enqueueTasks();
  }
};


module.exports = LineWorker;
