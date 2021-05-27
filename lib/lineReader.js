/* jshint node:true */

var util = require('util');
var events = require('events');
var Logger = require('pince');

/**
 * The LineReader takes a stream and allows you to consume it line-by-line.
 * Lines are defined by the regex /\r?\n/ .
 *
 * @instance readable: Whether the lineReader is currently readable.
 * @instance options: {maxLines: Max number of lines read}
 */
var LineReader = function(stream, options) {
  var self = this;
  if (!(this instanceof LineReader)) {
    return new LineReader(stream);
  }
  events.EventEmitter.call(this);

  this.options = options || {};
  //The left over partial line
  this._remainder = '';
  // _lines queued up for reading.
  this._lines = [];
  // Have we exhausted the stream?
  this._streamFinished = false;

  this.readable = false;

  this.numberLinesRead = 0;

  this.log = new Logger('LineReader');
  if (this.options.logLevel) Logger.setLevel('LineReader', this.options.logLevel);

  this.stream = stream;
  this.stream.on('end', function () {
    self.log.info('end');
    self._streamFinished = true;
    self.emit('end');
  });
  this.stream.on('error', function (error) {
    self.emit('error', error);
  });
  this.stream.on('readable', function () {
    self.log.debug('readable');
    self.readable = true;
    self.emit('readable');
  });
};

util.inherits(LineReader, events.EventEmitter);

LineReader.prototype.readLine = function() {
  if (this.options.maxLines && this.numberLinesRead++ >= this.options.maxLines) {
    // Hit the max lines, stop.
    this.readable = false;
    return null;
  }
  if (this._lines.length === 0) {
    var chunk = this.stream.read();

    if (chunk === null) {
      this.log.debug('found null chunk');
      this.readable = false;
      return null;
    }

    chunk = this._remainder + chunk;
    var newlines = chunk.split(/\r?\n/);
    if (this._streamFinished) {
      this._remainder = '';
    } else {
      this._remainder = newlines.pop();
    }
    this._lines = newlines;
  }

  return this._lines.shift();
};

LineReader.prototype.readLines = function(n) {
  n = n || 5;
  if (n < 0) throw new Error('n must be > 0');
  var lines = [];
  var line;
  while (n--) {
    line = this.readLine();
    if (line === null) break;
    lines.push(line);
  }
  return lines;
};

LineReader.prototype.finished = function () {
  if (this.options.maxLines && this.numberLinesRead > this.options.maxLines) {
    return true;
  }
  return this._streamFinished &&
    this._lines.length === 0 &&
    this._remainder === '';
};

module.exports = LineReader;
