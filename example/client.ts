import net = require('net');

const host = process.argv[2];
const port = Number(process.argv[3]);

const c = net.connect(port, host);

process.stdin.pipe(c).pipe(process.stdout);

process.stdin.setRawMode(true);
process.stdin.on('data', function (buf) {
    if (buf[0] === 3) c.end();
});

c.on('end', function () {
    process.stdin.setRawMode(false);
    process.exit();
});
