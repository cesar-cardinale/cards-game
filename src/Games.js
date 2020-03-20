import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:8000');

class Games {
    maxPoints = 0;
    isPrivate = false;
    ident = "";
    teammate = [];

    constructor(isPrivate, maxPoints) {
        this.isPrivate = isPrivate;
        this.maxPoints = maxPoints;
        this.ident = Math.random().toString(36).substring(2, 10);
        socket.emit('createGame', this );
    }
    getIdent() {
        return this.ident;
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