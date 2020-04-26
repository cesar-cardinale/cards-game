const io = require('socket.io-client');
const socketURL =
    process.env.NODE_ENV === 'production'
        ? 'http://web.cesarcardinale.fr:4001'
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
        username: '',
        IP: '',
        choice: '',
        deck: []
    };
    player3 = {
        username: '',
        IP: '',
        choice: '',
        deck: []
    };
    player4 = {
        username: '',
        IP: '',
        choice: '',
        deck: []
    };
    team = {
        T1P1: '',
        T1P2: '',
        T2P1: '',
        T2P2: ''
    };
    isTeamSet = false;
    startDeck = [];
    pointsT1 = 0;
    pointsT2 = 0;
    rounds = [];
    currentPlayer = '';
    currentRound = 0;
    isFinished = false;

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

    sortMyDeck(deck, asset){
        if(!deck) return;
        let carreau = [];
        let trefle = [];
        let coeur = [];
        let pique = [];
        deck.forEach((card) => {
            if (card.suit === asset.suit) { // Atout
                switch (card.value) {
                    case 'V':
                        if(card.suit === 'carreau') carreau.push({valueInt: 8, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 8, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 8, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 8, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 9:
                        if(card.suit === 'carreau') carreau.push({valueInt: 7, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 7, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 7, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 7, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 'A':
                        if(card.suit === 'carreau') carreau.push({valueInt: 6, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 6, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 6, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 6, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 10:
                        if(card.suit === 'carreau') carreau.push({valueInt: 5, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 5, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 5, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 5, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 'K':
                        if(card.suit === 'carreau') carreau.push({valueInt: 4, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 4, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 4, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 4, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 'Q':
                        if(card.suit === 'carreau') carreau.push({valueInt: 3, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 3, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 3, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 3, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 8:
                        if(card.suit === 'carreau') carreau.push({valueInt: 2, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 2, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 2, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 2, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 7:
                        if(card.suit === 'carreau') carreau.push({valueInt: 1, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 1, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 1, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 1, value: card.value, suit: card.suit, color: card.color});
                        break;
                    default:
                        break;
                }
            } else {
                switch (card.value) {
                    case 'A':
                        if(card.suit === 'carreau') carreau.push({valueInt: 8, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 8, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 8, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 8, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 10:
                        if(card.suit === 'carreau') carreau.push({valueInt: 7, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 7, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 7, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 7, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 'K':
                        if(card.suit === 'carreau') carreau.push({valueInt: 6, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 6, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 6, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 6, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 'Q':
                        if(card.suit === 'carreau') carreau.push({valueInt: 5, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 5, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 5, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 5, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 'V':
                        if(card.suit === 'carreau') carreau.push({valueInt: 4, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 4, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 4, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 4, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 9:
                        if(card.suit === 'carreau') carreau.push({valueInt: 3, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 3, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 3, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 3, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 8:
                        if(card.suit === 'carreau') carreau.push({valueInt: 2, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 2, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 2, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 2, value: card.value, suit: card.suit, color: card.color});
                        break;
                    case 7:
                        if(card.suit === 'carreau') carreau.push({valueInt: 1, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'trefle') trefle.push({valueInt: 1, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'coeur') coeur.push({valueInt: 1, value: card.value, suit: card.suit, color: card.color});
                        if(card.suit === 'pique') pique.push({valueInt: 1, value: card.value, suit: card.suit, color: card.color});
                        break;
                    default:
                        break;
                }
            }
        });
        carreau.sort(function(a, b) { return a.valueInt - b.valueInt; });
        trefle.sort(function(a, b) { return a.valueInt - b.valueInt; });
        coeur.sort(function(a, b) { return a.valueInt - b.valueInt; });
        pique.sort(function(a, b) { return a.valueInt - b.valueInt; });
        let allCardsInt = [].concat(carreau, trefle, coeur, pique);
        allCardsInt.reverse();
        let allCards = [];
        allCardsInt.forEach((card) => {
            allCards.push({value: card.value, suit: card.suit, color: card.color});
        });
        return allCards;
    }
    static getAllGamesJoinable(cb) {
        socket.emit('get-all-games');
        socket.on('all-games', (games) => cb(games) );
    }
}
export { Game };