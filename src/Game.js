const io = require('socket.io-client');
const socketURL =
    process.env.NODE_ENV === 'production'
        ? window.location.hostname
        : 'http://localhost:4001';

const socket = io.connect(socketURL, {secure: true});

class Game {
    maxPoints;
    isPrivate;
    ident;
    player1;
    player2;
    player3;
    player4;
    team = [["", ""], ["", ""]];
    isTeamSet = 0;

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
    onUpdate(cb){
        socket.on('update-game', (game) => cb(Object.assign(new Game(), game)));
    }
    addMate(username){
        socket.emit('add-mate', this.ident, username);
    }
    getCurrentPlayer(cb){
        socket.emit('current-player', this.ident);
        socket.on('current-player', (player) => cb(player) );
    }
    setChoice(cb, choice, username){
        socket.emit('set-choice', this.ident, username, choice);
        socket.on('update-game', (game) => cb(Object.assign(new Game(), game)));
    }


    static getGameByIdent(ident, cb) {
        socket.emit('getGame', ident);
        socket.on('game', (game) => cb(Object.assign(new Game(), game)) );
    }
}
export { Game };