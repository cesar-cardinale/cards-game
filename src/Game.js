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
        username: 'marie',
        IP: '2',
        choice: 'king',
        deck: []
    };
    player3 = {
        username: 'martin',
        IP: '3',
        choice: 'king',
        deck: []
    };
    player4 = {
        username: 'lucas',
        IP: '4',
        choice: 'king',
        deck: []
    };
    team = {
        T1P1: '',
        T1P2: 'marie',
        T2P1: 'martin',
        T2P2: 'lucas'
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
    newBid(){
        socket.emit('new-bid', this.ident, this.rounds);
    }

    getLastBid(username){
        let lastBid = null;
        this.rounds[this.currentRound].bids.forEach((bid) => {
            if(bid.username === username){ lastBid = bid; }
        });
        return lastBid;
    }
    passBid(){
        socket.emit('pass-bid', this.ident);
    }
    cardPlayed(player){
        socket.emit('card-played', this.ident, player, this.rounds);
    }
    cardPlayedFrom(card, username){
        socket.emit('card-played-from', this.ident, card, username);
    }
    sendUpdateNeeded(){
        socket.emit('get-game', this.ident);
    }


    static getGameByIdent(ident, cb) {
        socket.emit('getGame', ident);
        socket.on('game', (game) => cb(Object.assign(new Game(), game)) );
    }
}
export { Game };