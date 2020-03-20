import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:8000');

class Games {
    maxPoints = 0;
    isPrivate = false;
    ident = "";
    teammate1 = [];
    teammate2 = [];

    constructor(isPrivate, maxPoints) {
        this.isPrivate = isPrivate;
        this.maxPoints = maxPoints;
        this.ident = Math.random().toString(36).substring(2, 10);
    }
    send(){
        socket.emit('createGame', this );
    }
    getIdent() {
        return this.ident;
    }
    getCurrentPlayer(cb){
        socket.emit('currentPlayer', this.ident);
        socket.on('player', player => cb(null, player) );
    }
    addMate(username, cb){
        socket.emit('addMate', this.ident, username);
        socket.on('game', thisGame => cb(null, thisGame) );
    }
    static getGameByIdent(ident, cb) {
        socket.emit('getGame', ident);
        socket.on('game', thisGame => cb(null, thisGame) );
    }
}
export default Games;