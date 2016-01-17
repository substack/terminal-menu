var createCharm = require('charm');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var through = require('through2');
var duplexer = require('duplexer2');
var visualwidth = require('visualwidth');

module.exports = function (opts) {
    return new Menu(opts || {});
}

inherits(Menu, EventEmitter);

function Menu (opts) {
    var self = this;
    self.width = opts.width || 50;
    self.x = opts.x || 1;
    self.y = opts.y || 1;
    self.init = { x: self.x, y: self.y };
    self.items = [];
    self.lines = {};
    self.selected = opts.selected || 0;
    self.colors = {
        fg: opts.fg || 'white',
        bg: opts.bg || 'blue'
    };
    
    self.padding = opts.padding || {
        left: 2,
        right: 2,
        top: 1,
        bottom: 1
    };
    if (typeof self.padding === 'number') {
        self.padding = {
            left: self.padding,
            right: self.padding,
            top: self.padding,
            bottom: self.padding
        };
    }
    self.x += self.padding.left;
    self.y += self.padding.top;
    self.size = {
        x: self.width + self.padding.left + self.padding.right
    };
    
    self._input = through(
        function (buf, enc, next) {
            self._ondata(buf);
            next();
        },
        function () { self.emit('close') }
    );
    self._output = through();
    self.charm = opts.charm || createCharm({
        input: self._input
    });
    self.charm.on('error', function () {});
    self.charm.pipe(self._output);
    
    self.stream = self.charm.pipe(through());
    try {
        self.charm.display('reset');
        self.charm.display('bright');
    }
    catch (e) {}
    
    process.nextTick(function () {
        self._ticked = true;
        self.charm.cursor(false);
        self._draw();
    });
};

Menu.prototype.createStream = function () {
    return duplexer(this._input, this._output);
};

Menu.prototype.add = function (label, cb) {
    var index = this.items.length;
    if (cb) {
        this.on('select', function (x, ix) {
            if (ix === index) cb(x, ix);
        });
    }
    
    this.items.push({
        x: this.x,
        y: this.y,
        label: label
    });
    this._fillLine(this.y);
    this.y ++;
};

Menu.prototype._fillLine = function (y) {
    if (!this.lines[y]) {
        this.charm.position(this.init.x, y);
        this.charm.write(Array(1 + this.size.x).join(' '));
        this.lines[y] = true;
    }
};

Menu.prototype.jump = function (name) {
    var index = typeof name === 'number'
        ? name
        : this.items
            .map(function (item) { return item.label })
            .indexOf(name)
    ;
    if (index < 0) return;
    var prev = this.selected;
    this.selected = index;
    if (this._ticked) {
        this._drawRow(prev);
        this._drawRow(index);
    }
};

Menu.prototype.close = function () {
    this._input.end();
    this.charm.cursor(true);
    this.charm.display('reset');
    this.charm.position(1, this.y + 1);
    this.charm.end();
};

Menu.prototype.reset = function () {
    this.charm.reset();
};

Menu.prototype.write = function (msg) {
    this.charm.background(this.colors.bg);
    this.charm.foreground(this.colors.fg);
    this._fillLine(this.y);
    
    var parts = msg.split('\n');
    
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].length) {
            this.charm.position(this.x, this.y);
            this.charm.write(parts[i]);
        }
        if (i !== parts.length - 1) {
            this.x = this.init.x + this.padding.left;
            this._fillLine(this.y);
            this.y ++;
        }
    }
};

Menu.prototype._draw = function () {
    for (var i = 0; i < this.padding.top; i++) {
        this._fillLine(this.init.y + i);
    }
    for (var i = 0; i < this.items.length; i++) this._drawRow(i);
    
    // reset foreground and background colors
    this.charm.background(this.colors.bg);
    this.charm.foreground(this.colors.fg);
    
    for (var i = 0; i < this.padding.bottom; i++) {
        this._fillLine(this.y + i);
    }
};

Menu.prototype._drawRow = function (index) {
    index = (index + this.items.length) % this.items.length;
    var item = this.items[index];
    this.charm.position(item.x, item.y);
    
    if (this.selected === index) {
        this.charm.background(this.colors.fg);
        this.charm.foreground(this.colors.bg);
    }
    else {
        this.charm.background(this.colors.bg);
        this.charm.foreground(this.colors.fg);
    }
    
    var len = this.width - visualwidth.width(item.label, true) + 1;
    this.charm.write(item.label + Array(Math.max(0, len)).join(' '));
};

Menu.prototype._ondata = function ondata (buf) {
    var bytes = [].slice.call(buf);
    while (bytes.length) {
        var codes = [].join.call(bytes, '.');
        if (/^(27.91.65|27,79.65|107|16)\b/.test(codes)) { // up or k
            this.selected = (this.selected - 1 + this.items.length)
                % this.items.length
            ;
            this._drawRow(this.selected + 1);
            this._drawRow(this.selected);
            if (/^107\b/.test(codes)) bytes.shift()
            else bytes.splice(0, 3);
        }
        if (/^(27.91.66|27.79.66|106|14)\b/.test(codes)) { // down or j
            this.selected = (this.selected + 1) % this.items.length;
            this._drawRow(this.selected - 1);
            this._drawRow(this.selected);
            if (/^106\b/.test(codes)) bytes.shift()
            else bytes.splice(0, 3);
        }
        else if (/^(3|113)/.test(codes)) { // ^C or q
            this.y = 0;
            this.charm.reset();
            this.close();
            bytes.shift();
        }
        else if (/^(13|10)\b/.test(codes)) { // enter
            this.charm.position(1, this.items[this.items.length-1].y + 2);
            this.charm.display('reset');
            this.emit('select', this.items[this.selected].label, this.selected);
            bytes.shift();
        }
        else bytes.shift();
    }
};
