import Menu = require('../');
import net = require('net');

const server = net.createServer(function (stream) {
    const menu = Menu({ width: 60, x: 4, y: 2 });
    menu.reset();
    menu.write('SHALL WE PLAY A GAME?\n');
    menu.write('-------------------------\n');
    menu.add('CHESS');
    menu.add('POKER');
    menu.add('FIGHTER COMBAT');
    menu.add('GUERILLA ENGAGEMENT');
    menu.add('DESERT WARFARE');
    menu.add('AIR-TO-GROUND ACTIONS');
    menu.add('THEATERWIDE TACTICAL WARFARE');
    menu.add('THEATERWIDE BIOTOXIC AND CHEMICAL WARFARE');
    menu.add('GLOBAL THERMONUCLEAR WAR');
    menu.add('EXIT');
    
    menu.on('select', function (label) {
        menu.close();
        stream.end('\nTHE ONLY WINNING MOVE IS NOT TO PLAY.\n');
    });
    stream.pipe(menu.createStream()).pipe(stream);
});
server.listen(5000);
