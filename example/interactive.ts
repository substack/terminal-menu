import Menu = require('../');

let latency = 0;

const menu = Menu({width: 29, x: 4, y: 2});
drawMenu();
menu.on('select', handleSelection);

process.stdin.pipe(menu.createStream()).pipe(process.stdout);
process.stdin.setRawMode(true);

menu.on('close', function () {
    process.stdin.setRawMode(false);
    process.stdin.end();
});

function drawMenu() {
    menu.reset();
    menu.write('My Application\n');
    menu.write('-------------------------\n');
    menu.write('Latency: ' + latency + ' ms\n');
    menu.write('-------------------------\n');
    menu.add('Increase Latency');
    menu.add('Decrease Latency');
    menu.add('Exit');
}

function handleSelection(label: string) {
    switch (label) {
        case 'Increase Latency':
            latency += 100;
            break;
        case 'Decrease Latency':
            latency -= 100;
            break;
        case 'Exit':
            menu.close();
            return;
    }

    drawMenu();
}
