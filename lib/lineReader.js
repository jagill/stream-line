/* jshint node:true */

var util = require('util');
var events = require('events');

/**
 * The LineReader takes a stream and allows you to consume it line-by-line.
 * Lines are defined by the regex /\r?\n/ .
 *
 * @instance readable: Whether the lineReader is currently readable.
 */
var LineReader = function(stream) {
  var self = this;
  if (!(this instanceof LineReader)) {
    return new LineReader(stream);
  }
  events.EventEmitter.call(this);

  //The left over partial line
  this._remainder = '';
  // _lines queued up for reading.
  this._lines = [];
  // Have we exhausted the stream?
  this._streamFinished = false;

  this.readable = false;

  this.stream = stream;
  this.stream.on('end', function () {
    console.log('end');
    self._streamFinished = true;
  });
  this.stream.on('error', function (error) {
    self.emit('error', error);
  });
  this.stream.on('readable', function () {
    console.log('readable');
    self.readable = true;
    self.emit('readable');
  });
};

util.inherits(LineReader, events.EventEmitter);

LineReader.prototype.readLine = function() {
  if (this._lines.length === 0) {
    var chunk = this.stream.read();

    if (chunk === null) {
      console.log('found null chunk');
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
  return this._streamFinished &&
    this._lines.length === 0 &&
    this._remainder === '';
};

module.exports = LineReader;
