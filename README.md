Stream Line
===========

This has two utilities for processing `Readable` streams one line (as defined by
`/\r?\n/`) at a time.  The first is `LineReader`, which lets you read a stream
line-by-line.  The second is `LineWorker` which lets you define a worker
function that will process the stream, line-by-line.

LineReader
----------

```javascript
var fs = require('fs');
var LineReader = require('stream-line').LineReader;

var fileStream = fs.createReadStream(aVeryLargeFile);

var lineReader = new LineReader(fileStream);

var lineNumber = 0;
lineReader.on('readable', function () {
  while (lineReader.readable) {
    console.log(lineNumber++, ':', lineReader.readLine());
  }
});
```

LineWorker
----------

```javascript
var fs = require('fs');
var LineWorker = require('./index').LineWorker;

var fileStream = fs.createReadStream(aVeryLargeFile);

var options = {
  concurrency : 3,
  maxQueueSize : 10,
};

var worker = function (data, callback) {
  setTimeout(function () {
    console.log('sent', data);
    callback();
  }, 1000);
};

var lineWorker = new LineWorker(fileStream, worker, options, function (error) {
  if (error) {
    console.error('Error processing:', error);
  } else {
    console.log('Done!');
  }
});

lineWorker.start();

```
