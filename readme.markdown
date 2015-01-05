# terminal-menu

retro ansi terminal menus for serious 80s technicolor business

![terminal menu](http://substack.net/images/screenshots/terminal_menu.png)

# example

``` js
var Menu = require('terminal-menu');
var menu = Menu({ width: 29, x: 4, y: 2 });
menu.reset();
menu.write('SERIOUS BUSINESS TERMINAL\n');
menu.write('-------------------------\n');

menu.add('ADD TRANSACTION INVOICE');
menu.add('BUSINESS INTELLIGENCE');
menu.add('ACCOUNTS PAYABLE', function(label, index) {
    console.log('I AM '+label+' AT INDEX '+index);
});
menu.add('LEDGER BOOKINGS');
menu.add('INDICATOR CHART METRICS');
menu.add('BACKUP DATA TO FLOPPY DISK');
menu.add('RESTORE FROM FLOPPY DISK');
menu.add('欢迎来到substack的编码世界');
menu.add('EXIT');

menu.on('select', function (label) {
    menu.close();
    console.log('SELECTED: ' + label);
});
menu.createStream().pipe(process.stdout);
```

# methods

``` js
var createMenu = require('terminal-menu')
```

## var menu = createMenu(opts)

Create a menu with `opts`:

* `opts.width` - menu width in columns
* `opts.x` - top-left corner x offset, default: 1
* `opts.y` - top-left corner y offset, default: 1
* `opts.fg` - foreground color, default: 'white'
* `opts.bg` - background color, default: 'blue'
* `opts.padding.left` - left padding in columns
* `opts.padding.right` - right padding in columns
* `opts.padding.top` - top padding in rows
* `opts.padding.bottom` - bottom padding in rows
* `opts.selected` - set the selected element by its index

The menu can be driven around with the arrow keys and j/k, vi-style.
To quit out of the menu, hit `^C` or `q`.

## menu.add(label[, callback])

Create a new selectable menu item with the string `label`. The callback is optional.

## menu.write(msg)

Write a message to the menu.

## menu.createStream()

Return the stream to be piped to a terminal.

## menu.reset()

Reset the terminal, clearing all contents.

## menu.close(opts={})

Unregister all listeners and put the terminal back to its original state.

Set `opts.keepalive` to `true` to keep raw mode enabled on `process.stdin`.

# events

## menu.on('select', function (label, index) {})

When the user selects a label, this event fires with the label string and menu
index.

# install

With [npm](https://npmjs.org) do:

```
npm install terminal-menu
```

# license

MIT
