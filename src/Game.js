import openSocket from 'socket.io-client';
const  socket = openSocket('http://192.168.1.11:8000');

class Game {
    maxPoints;
    isPrivate;
    ident;
    teammate1 = [];
    teammate2 = [];

    constructor(ident, isPrivate, maxPoints) {
        this.ident = ident;
        this.isPrivate = isPrivate;
        this.maxPoints = maxPoints;
    }
    send(){
        socket.emit('add-game', this );
    }
    populate(cb){
        socket.emit('get-game', this.ident);
        socket.on('update-game', (game) => cb(Object.assign(new Game(), game)));
    }
    addMate(username){
        socket.emit('add-mate', this.ident, username);
    }
    onUpdate(cb){
        socket.on('update-game', (game) => cb(Object.assign(new Game(), game)));
    }
    getCurrentPlayer(cb){
        socket.emit('current-player', this.ident);
        socket.on('current-player', (player) => cb(player) );
    }


    static getGameByIdent(ident, cb) {
        socket.emit('getGame', ident);
        socket.on('game', (game) => cb(Object.assign(new Game(), game)) );
    }
}
export { Game };