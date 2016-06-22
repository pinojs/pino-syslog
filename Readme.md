# pino-syslog

*pino-syslog* is a so called "transport" for the [pino][pino] logger. *pino-syslog* receives *pino* logs from `stdin`
and transforms them into [RFC3164][syslog] (syslog) formatted messages, which are written to `stdout`.

This transport **does not** send messages to a remote, or even local, syslog compatible server. It merely reformats the
logs into syslog compatible strings. To send logs to a syslog server, use the [pino-socket][pino-socket] transport.
For example:

```bash
$ node your-app.js | pino-syslog | pino-socket -a syslog.example.com
```

**Message length:** the RFC mandates that the maximum number of bytes that a syslog message may be is `1024`. Thus,
*pino-transport* will do one of two things when this limit is exceeded:

1. Output a JSON error log, with syslog header, that includes the original log's `time` and `level` properties, a
  `originalSize` property set to the number of bytes the original log message consumed, and a `msg` property set to
  "message exceeded syslog 1024 byte limit".
2. Truncate the message to fit within the 1024 byte limit when the `messageOnly` configuration option is set to `true`.

This means you *can* lose data if your log messages are too large. If that is to be the case, you should investigate
the `includeProperties` option to reduce your log size. But, really, you should investigate what it is you are logging.

[pino]: https://www.npmjs.com/package/pino
[syslog]: https://tools.ietf.org/html/rfc3164
[pino-socket]: https://www.npmjs.com/package/pino-socket

## Example

Given the log:

```json
{"pid":94473,"hostname":"MacBook-Pro-3","level":30,"msg":"hello world","time":1459529098958,"v":1}
```

*pino-syslog* will write out:

```
<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: {"pid":94473,"hostname":"MacBook-Pro-3","level":30,"msg":"hello world","time":1459529098958,"v":1}
```

Putting it all together:

```bash
$ echo '{"pid":94473,"hostname":"MacBook-Pro-3","level":30,"msg":"hello world","time":1459529098958,"v":1}' | node pino-syslog                                                       [s:0 l:8025]
<134>Apr  1 16:44:58 MacBook-Pro-3 none[94473]: {"pid":94473,"hostname":"MacBook-Pro-3","level":30,"msg":"hello world","time":1459529098958,"v":1}
```

## Install

You should install *pino-syslog* globally so that it can be used as a utility:

```bash
$ npm install --production -g pino-syslog
```

## Command Line Arguments

There is only one argument available: `--config` (`-c`). This argument is used to load a JSON configuration file.

### Configuration

*pino-syslog* supports configuration via a JSON file. The default options are:

```json
{
  "appname": "none",
  "cee": false,
  "facility": 16,
  "includeProperties": [],
  "messageOnly": false,
  "tz": "Etc/UTC"
}
```

+ `appname` (string): sets the name of the application in the 'TAG' portion of the syslog header.
+ `cee` (boolean): denotes whether or not to prefix the message field with `@cee: `. This will only work if
  `messageOnly` is `false`.
+ `facility` (number): a valid [facility number][facility], `[0 - 23]`.
+ `includeProperties` (array<string>): a list of property names from the original *pino* log to include in the formatted
  message. This is only applicable if `messageOnly` is `false`.
+ `messageOnly` (boolean): indicates if the message field should contain only the `msg` property of the *pino* log, or
  if it should be stringified JSON.
+ `tz` (string): any [valid timezone string][tzstring] that [moment][moment] will recognize. The timestamp field of the
  syslog header will be sent according to this setting.

[facility]: https://tools.ietf.org/html/rfc3164#section-4.1.1
[tzstring]: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
[moment]: http://momentjs.com/timezone/docs/#/using-timezones/parsing-in-zone/

## License

[MIT License](http://jsumners.mit-license.org/)
