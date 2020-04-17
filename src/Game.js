const io = require('socket.io-client');
const socketURL =
    process.env.NODE_ENV === 'production'
        ? 'http://192.168.1.11:4001'
        : 'http://localhost:4001';

const socket = io.connect(socketURL, {secure: true});

class Game {
    maxPoints;
    isPrivate;
    ident;
    player1 = {
        username: '',
        IP: '',
        choice: '',
        deck: []
    };
    player2 = {
        username: 'test1',
        IP: '1',
        choice: 'mates',
        deck: []
    };
    player3 = {
        username: 'test2',
        IP: '2',
        choice: 'mates',
        deck: []
    };
    player4 = {
        username: 'test3',
        IP: '3',
        choice: 'mates',
        deck: []
    };
    team = {
        T1P1: '',
        T1P2: 'test1',
        T2P1: 'test2',
        T2P2: 'test3'
    };
    isTeamSet = false;
    startDeck = [];
    pointsT1 = 0;
    pointsT2 = 0;
    rounds = [];
    currentPlayer = '';
    currentRound = 0;

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
    setChoice(cb, cc, choice, username){
        socket.emit('set-choice', this.ident, username, choice);
        socket.on('update-game', (game) => cb(Object.assign(new Game(), game)));
        socket.on('current-player', (player) => cc(player) );
    }
    getChoice(){
        const choices = [this.player1.choice, this.player2.choice, this.player3.choice, this.player4.choice].filter( (el) => { return el !== ""; });
        const choice = this.mostRecurring(choices);
        return ( choice === 'king')? {value: 'king', title: 'Tirage des rois'} : {value: 'mates', title: 'Choix de l\'équipier'};
    }
    mostRecurring(arr){
        return arr.sort((a,b) => arr.filter(v => v===a).length - arr.filter(v => v===b).length ).pop();
    }
    setTeam(me, mate, adv1, adv2){
        this.team.T1P1 = me;
        this.team.T1P2 = mate;
        this.team.T2P1 = adv1;
        this.team.T2P2 = adv2;
        socket.emit('set-team', this.ident, this.team);
    }


    static getGameByIdent(ident, cb) {
        socket.emit('getGame', ident);
        socket.on('game', (game) => cb(Object.assign(new Game(), game)) );
    }
}
export { Game };