import {EventEmitter} from 'events';
import through = require('through2');
import duplexer = require('duplexer2');
import createCharm = require('charm');
import {CharmInstance} from "charm";

const visualwidth = require('visualwidth');

export interface IMenuOpts {
    width?: number;
    x?: number;
    y?: number;
    selected?: number;
    fg?: string;
    bg?: string;
    padding?: { left: number, right: number, top: number, bottom: number } | number;
    charm?: CharmInstance;
}

export default class Menu extends EventEmitter {

    private readonly width: number = 50;
    private x: number = 1;
    private y: number = 1;
    private init: { x: number, y: number };
    private items: any[] = [];
    private lines: any = {};
    private selected: number;
    private colors: any;
    private padding: { left: number, right: number, top: number, bottom: number } = {
        left: 2,
        right: 2,
        top: 1,
        bottom: 1
    };
    private size: any;
    private readonly _input: any;
    private readonly _output: any;
    private charm: CharmInstance;
    private stream: any;
    private _ticked: boolean = false;

    constructor(opts: IMenuOpts) {
        super();

        if (typeof opts.width === 'number') {
            this.width = opts.width;
        }

        if (typeof opts.x === 'number') {
            this.x = opts.x;
        }

        if (typeof opts.y === 'number') {
            this.y = opts.y;
        }

        this.init = {x: this.x, y: this.y};
        this.selected = opts.selected || 0;
        this.colors = {
            fg: opts.fg || 'white',
            bg: opts.bg || 'blue'
        };

        if (opts.padding) {
            if (typeof opts.padding === 'number') {
                this.padding = {
                    left: opts.padding,
                    right: opts.padding,
                    top: opts.padding,
                    bottom: opts.padding
                };
            } else {
                this.padding = opts.padding;
            }
        }

        this.x += this.padding.left;
        this.y += this.padding.top;

        this.size = {
            x: this.width + this.padding.left + this.padding.right
        };

        this._input = through(
            (buf, enc, next) => {
                this._ondata(buf);
                next();
            },
            () => {
                this.emit('close')
            }
        );
        this._output = through();
        this.charm = opts.charm || createCharm({
            input: this._input
        } as any);
        this.charm.on('error', function () {
        });
        this.charm.pipe(this._output);

        this.stream = this.charm.pipe(through());

        try {
            this.charm.display('reset');
            this.charm.display('bright');
        }
        catch (e) {
        }

        process.nextTick(() => {
            this._ticked = true;
            this.charm.cursor(false);
            this._draw();
        });
    }

    createStream() {
        return duplexer(this._input, this._output);
    }

    add(label: string, cb?: (label: string, index: number) => void) {
        let index = this.items.length;
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
        this.y++;
    }

    jump(name: string | number) {
        let index = typeof name === 'number'
            ? name
            : this.items
                .map(function (item) {
                    return item.label
                })
                .indexOf(name)
        ;
        if (index < 0) return;
        let prev = this.selected;
        this.selected = index;
        if (this._ticked) {
            this._drawRow(prev);
            this._drawRow(index);
        }
    }

    close() {
        this._input.end();
        this.charm.cursor(true);
        this.charm.display('reset');
        this.charm.position(1, this.y + 1);
        this.charm.end();
    }

    reset() {
        this.charm.reset();
        this.charm.display('reset');
        this.charm.display('bright');

        this.items = [];
        this.lines = {};

        this.x = this.init.x + this.padding.left;
        this.y = this.init.y + this.padding.top;

        process.nextTick(() => {
            this._ticked = true;
            this.charm.cursor(false);
            this._draw();
        });
    }

    write(msg: string) {
        this.charm.background(this.colors.bg);
        this.charm.foreground(this.colors.fg);
        this._fillLine(this.y);

        let parts = msg.split('\n');

        for (let i = 0; i < parts.length; i++) {
            if (parts[i].length) {
                this.charm.position(this.x, this.y);
                this.charm.write(parts[i]);
            }
            if (i !== parts.length - 1) {
                this.x = this.init.x + this.padding.left;
                this._fillLine(this.y);
                this.y++;
            }
        }
    }

    private _draw() {
        for (let i = 0; i < this.padding.top; i++) {
            this._fillLine(this.init.y + i);
        }

        for (let i = 0; i < this.items.length; i++) {
            this._drawRow(i);
        }

        // reset foreground and background colors
        this.charm.background(this.colors.bg);
        this.charm.foreground(this.colors.fg);

        for (let i = 0; i < this.padding.bottom; i++) {
            this._fillLine(this.y + i);
        }
    }

    private _fillLine(y: number) {
        if (!this.lines[y]) {
            this.charm.position(this.init.x, y);
            this.charm.write(Array(1 + this.size.x).join(' '));
            this.lines[y] = true;
        }
    }

    private _drawRow(index: number) {
        index = (index + this.items.length) % this.items.length;
        let item = this.items[index];
        this.charm.position(item.x, item.y);

        if (this.selected === index) {
            this.charm.background(this.colors.fg);
            this.charm.foreground(this.colors.bg);
        } else {
            this.charm.background(this.colors.bg);
            this.charm.foreground(this.colors.fg);
        }

        let len = this.width - visualwidth.width(item.label, true) + 1;
        this.charm.write(item.label + Array(Math.max(0, len)).join(' '));
    }

    private _ondata(buf: Buffer) {
        let bytes = [].slice.call(buf);
        while (bytes.length) {
            let codes = [].join.call(bytes, '.');

            if (/^(27.91.65|27,79.65|107|16)\b/.test(codes)) { // up or k
                this.selected = (this.selected - 1 + this.items.length)
                    % this.items.length;
                this._drawRow(this.selected + 1);
                this._drawRow(this.selected);

                if (/^107\b/.test(codes)) {
                    bytes.shift();
                } else {
                    bytes.splice(0, 3);
                }
            }

            if (/^(27.91.66|27.79.66|106|14)\b/.test(codes)) { // down or j
                this.selected = (this.selected + 1) % this.items.length;
                this._drawRow(this.selected - 1);
                this._drawRow(this.selected);

                if (/^106\b/.test(codes)) {
                    bytes.shift();
                } else {
                    bytes.splice(0, 3);
                }
            } else if (/^(3|113)/.test(codes)) { // ^C or q
                this.charm.reset();
                this._input.end();
                this._output.end();
                bytes.shift();
            } else if (/^(13|10)\b/.test(codes)) { // enter
                this.charm.position(1, this.items[this.items.length - 1].y + 2);
                this.charm.display('reset');
                this.emit('select', this.items[this.selected].label, this.selected);
                bytes.shift();
            } else {
                bytes.shift();
            }
        }
    }
}