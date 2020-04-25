const chalk = require('chalk');
const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { origins:'*:*' });
const db = require('better-sqlite3')('database.db');
const port = process.env.PORT || 4001;
const suits = ["coeur", "pique", "trefle", "carreau"];
const values = ["A", 7, 8, 9, 10, "J", "Q", "K"];

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'));
  app.get('*', (req, res) => { res.sendFile(path.resolve(__dirname, 'build', 'index.html')); });
}

io.on('connection', (client) => {
  // Ajout du nouveau jeu dans la database

  /*
  client.on('add-game', (game) => {
    const stmt = db.prepare('INSERT INTO contree (ident, isPrivate, maxPoints, player2, player3, player4, team) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const isPrivate = (game.isPrivate)? 'true' : 'false';
    stmt.run(game.ident, isPrivate, game.maxPoints, JSON.stringify(game.player2), JSON.stringify(game.player3), JSON.stringify(game.player4), JSON.stringify(game.team));
    console.log('[!]#'+chalk.greenBright.bold(game.ident)+' added');
  });
  */

  client.on('add-game', (game) => {
    const stmt = db.prepare('INSERT INTO contree (ident, isPrivate, maxPoints, team) VALUES (?, ?, ?, ?)');
    const isPrivate = (game.isPrivate)? 'true' : 'false';
    stmt.run(game.ident, isPrivate, game.maxPoints, JSON.stringify(game.team));
    console.log('[!]#'+chalk.greenBright.bold(game.ident)+' added');
  });

  client.on('get-game', (ident) => {
    const stmt = db.prepare('SELECT * FROM contree WHERE ident=? LIMIT 1');
    const game = stmt.get(ident);
    client.emit('update-game', game);
  });

  client.on('get-all-games', () => {
    const stmt = db.prepare('SELECT * FROM contree WHERE isPrivate=\'false\' AND isTeamSet=\'false\'');
    const allGames = stmt.all();
    allGames.filter(game => (game.isTeamSet === 'false' && game.isPrivate === 'false'));
    client.emit('all-games', allGames);
    console.log(chalk.yellow('[!] Get All Games Joinable'));
  });

  client.on('add-mate', (ident, username) => {
    const clientIp = client.request.connection.remoteAddress;
    const player = {
      'username': username,
      'IP': clientIp,
      'choice': null,
      'deck': []
    };
    const stmt = db.prepare('SELECT * FROM contree WHERE ident=? LIMIT 1');
    let game = stmt.get(ident);
    if(game) {
      let team = JSON.parse(game.team);
      const stmtTeam = db.prepare('UPDATE contree SET team=? WHERE ident=?');
      if (!game.player1) {
        const stmt1 = db.prepare('UPDATE contree SET player1=? WHERE ident=?');
        stmt1.run(JSON.stringify(player), ident);
        team.T1P1 = username;
        console.log('[!]#' + chalk.greenBright.bold(game.ident), '[ADD P1]', username);
      } else if (!game.player2) {
        const stmt1 = db.prepare('UPDATE contree SET player2=? WHERE ident=?');
        stmt1.run(JSON.stringify(player), ident);
        team.T1P2 = username;
        console.log('[!]#' + chalk.greenBright.bold(game.ident), '[ADD P2]', username);
      } else if (!game.player3) {
        const stmt1 = db.prepare('UPDATE contree SET player3=? WHERE ident=?');
        stmt1.run(JSON.stringify(player), ident);
        team.T2P1 = username;
        console.log('[!]#' + chalk.greenBright.bold(game.ident), '[ADD P3]', username);
      } else if (!game.player4) {
        const stmt1 = db.prepare('UPDATE contree SET player4=? WHERE ident=?');
        stmt1.run(JSON.stringify(player), ident);
        team.T2P2 = username;
        console.log('[!]#' + chalk.greenBright.bold(game.ident), '[ADD P4]', username);
      }
      if(!game.currentPlayer){
        game.currentPlayer = username;
        const stmt1 = db.prepare('UPDATE contree SET currentPlayer=? WHERE ident=?');
        stmt1.run(game.currentPlayer, ident);
        console.log('[!]#' + chalk.greenBright.bold(game.ident), '[CURRENT PLAYER]', username);
      }
      stmtTeam.run(JSON.stringify(team), ident);
      game = stmt.get(ident);
    }
    io.emit('update-game', game);
  });

  client.on('current-player', (ident) => {
    const clientIp = client.request.connection.remoteAddress;
    const stmt = db.prepare('SELECT * FROM contree WHERE ident=? LIMIT 1');
    let game = stmt.get(ident);
    let currentPlayer = null;
    if(game) {
      if (game.player1 && JSON.parse(game.player1).IP === clientIp) {
        currentPlayer = JSON.parse(game.player1);
      } else if (game.player2 && JSON.parse(game.player2).IP === clientIp) {
        currentPlayer = JSON.parse(game.player2);
      } else if (game.player3 && JSON.parse(game.player3).IP === clientIp) {
        currentPlayer = JSON.parse(game.player3);
      } else if (game.player4 && JSON.parse(game.player4).IP === clientIp) {
        currentPlayer = JSON.parse(game.player4);
      }
    }
    console.log('[!]#' + chalk.yellow.bold(ident), 'Current user asked //', (currentPlayer) ? currentPlayer.username : currentPlayer);
    client.emit('current-player', currentPlayer);
  });

  client.on('set-choice', (ident, username, choice) => {
    const stmt = db.prepare('SELECT * FROM contree WHERE ident=? LIMIT 1');
    let game = stmt.get(ident);
    if(game) {
      game.isTeamSet = JSON.parse(game.isTeamSet);
      game.player1 = JSON.parse(game.player1);
      game.player2 = JSON.parse(game.player2);
      game.player3 = JSON.parse(game.player3);
      game.player4 = JSON.parse(game.player4);
      game.team = JSON.parse(game.team);
      if (game.player1 && game.player1.username === username) {
          game.player1.choice = choice;
          const stmt1 = db.prepare('UPDATE contree SET player1=? WHERE ident=?');
          stmt1.run(JSON.stringify(game.player1), ident);
          console.log('[!]#' + chalk.greenBright.bold(game.ident), '[UPDATE P1]', username);
      } else if (game.player2 && game.player2.username === username) {
          game.player2.choice = choice;
          const stmt1 = db.prepare('UPDATE contree SET player2=? WHERE ident=?');
          stmt1.run(JSON.stringify(game.player2), ident);
          console.log('[!]#' + chalk.greenBright.bold(game.ident), '[UPDATE P2]', username);
      } else if (game.player3 && game.player3.username === username) {
          game.player3.choice = choice;
          const stmt1 = db.prepare('UPDATE contree SET player3=? WHERE ident=?');
          stmt1.run(JSON.stringify(game.player3), ident);
          console.log('[!]#' + chalk.greenBright.bold(game.ident), '[UPDATE P3]', username);
      } else if (game.player4 && game.player4.username === username) {
          game.player4.choice = choice;
          const stmt1 = db.prepare('UPDATE contree SET player4=? WHERE ident=?');
          stmt1.run(JSON.stringify(game.player4), ident);
          console.log('[!]#' + chalk.greenBright.bold(game.ident), '[UPDATE P4]', username);
      }

      if(!game.isTeamSet && [game.player1.choice, game.player2.choice, game.player3.choice, game.player4.choice].filter( (el) => el !== undefined ).length === 4) {
        game.startDeck = [];
        // Si tous les choix sont faits, on initialise le paquet de base du jeu
        for (let i = 0; i < suits.length; i++) {
          for (let x = 0; x < values.length; x++) {
            let color;
            if(suits[i] === 'carreau' || suits[i] === 'coeur') color = 'rouge';
            if(suits[i] === 'trefle' || suits[i] === 'pique') color = 'noir';
            let card = {value: values[x], suit: suits[i], color: color};
            game.startDeck.push(card);
          }
        }
        // Et on le mélange
        for(let i = game.startDeck.length - 1; i > 0; i--){
          const j = Math.floor(Math.random() * i);
          const temp = game.startDeck[i];
          game.startDeck[i] = game.startDeck[j];
          game.startDeck[j] = temp;
        }
        const stmt2 = db.prepare('UPDATE contree SET startDeck=? WHERE ident=?');
        stmt2.run(JSON.stringify(game.startDeck), ident);
        console.log('[!]#' + chalk.greenBright.bold(game.ident), '[START DECK] Saved');

        const choice = getChoice(game); //{value: 'mates', title: 'Séléctionnez votre équipier'}; //{value: 'king', title: 'Tirage des rois'}; //getChoice(game);
        if(choice.value === 'king') startSortByKingTeam(game);
      }
      game = stmt.get(ident);
      io.emit('update-game', game);
    }
  });

  client.on('set-team', (ident, team) => {
    console.log(chalk.magenta(JSON.stringify(team)));
    const stmt = db.prepare('SELECT * FROM contree WHERE ident=? LIMIT 1');
    let game = stmt.get(ident);
    if(game && game.isTeamSet === "false") {
      const stmt2 = db.prepare('UPDATE contree SET team=?, isTeamSet=? WHERE ident=?');
      stmt2.run(JSON.stringify(team), "true", ident);
      console.log('[!]#' + chalk.greenBright.bold(game.ident), '[TEAM] Saved');
      firstDistribute(game);
    }
    game = stmt.get(ident);
    io.emit('update-game', game);
  });

  client.on('new-bid', (ident, rounds) => {
    const stmt = db.prepare('SELECT * FROM contree WHERE ident=? LIMIT 1');
    let game = stmt.get(ident);
    if(game) {
      game.team = JSON.parse(game.team);
      game.rounds = rounds;
      game = setNextCurrentPlayer(game);
      saveRounds(game);
      console.log('[!]#' + chalk.greenBright.bold(game.ident), '[ROUNDS] Bid - Updated');
    }
    game = stmt.get(ident);
    io.emit('update-game', game);
  });

  client.on('pass-bid', (ident) => {
    const stmt = db.prepare('SELECT * FROM contree WHERE ident=? LIMIT 1');
    let game = stmt.get(ident);
    if(game) {
      game.team = JSON.parse(game.team);
      game.rounds = JSON.parse(game.rounds);
      game = setNextCurrentPlayer(game);
      game = testIfBidIsFinished(game);
      saveRounds(game);
      console.log('[!]#' + chalk.greenBright.bold(game.ident), '[ROUNDS] Pass - Updated');
    }
    game = stmt.get(ident);
    io.emit('update-game', game);
  });
  client.on('card-played', (ident, card, username) => {
    const stmt = db.prepare('SELECT * FROM contree WHERE ident=? LIMIT 1');
    let game = stmt.get(ident);
    if(game) {
      game.player1 = JSON.parse(game.player1);
      game.player2 = JSON.parse(game.player2);
      game.player3 = JSON.parse(game.player3);
      game.player4 = JSON.parse(game.player4);
      game.rounds = JSON.parse(game.rounds);
      game.startDeck = JSON.parse(game.startDeck);
      game.team = JSON.parse(game.team);
      if(game.rounds[game.currentRound].folds[game.rounds[game.currentRound].currentFold].length >= 4) {
        const winner = winnerOfFold(game.rounds[game.currentRound].folds[game.rounds[game.currentRound].currentFold], game.rounds[game.currentRound].asset);
        const teamWinner = getTeam(winner.username, game.team);
        if(teamWinner === 1) game.rounds[game.currentRound].pointsT1 += winner.points;
        if(teamWinner === 2) game.rounds[game.currentRound].pointsT2 += winner.points;
        game.rounds[game.currentRound].currentPlayer = winner.username;
        game.rounds[game.currentRound].currentFold += 1;
        game.rounds[game.currentRound].folds.push([]);
      }
      game.rounds[game.currentRound].folds[game.rounds[game.currentRound].currentFold].push({card: card, username: username});
      game = setNextCurrentPlayer(game);
      saveRounds(game);
      if(game.player1.username === username){
        game.player1.deck = game.player1.deck.filter(thisCard => (thisCard.suit !== card.suit || thisCard.value !== card.value) );
        updatePlayer(game, game.player1);
      } else if(game.player2.username === username){
        game.player2.deck = game.player2.deck.filter(thisCard => (thisCard.suit !== card.suit || thisCard.value !== card.value) );
        updatePlayer(game, game.player2);
      } else if(game.player3.username === username){
        game.player3.deck = game.player3.deck.filter(thisCard => (thisCard.suit !== card.suit || thisCard.value !== card.value) );
        updatePlayer(game, game.player3);
      } else if(game.player4.username === username){
        game.player4.deck = game.player4.deck.filter(thisCard => (thisCard.suit !== card.suit || thisCard.value !== card.value) );
        updatePlayer(game, game.player4);
      }

      game = stmt.get(ident);
      game.player1 = JSON.parse(game.player1);
      game.player2 = JSON.parse(game.player2);
      game.player3 = JSON.parse(game.player3);
      game.player4 = JSON.parse(game.player4);
      game.rounds = JSON.parse(game.rounds);
      game.startDeck = JSON.parse(game.startDeck);
      game.team = JSON.parse(game.team);
      if(game.player1.deck.length === 0 && game.player2.deck.length === 0 && game.player3.deck.length === 0 && game.player4.deck.length === 0){
        if(game.rounds[game.currentRound].teamSpeaker === 1){
          if (game.rounds[game.currentRound].pointsT1 >= game.rounds[game.currentRound].asset.points){
            game.pointsT1 += game.rounds[game.currentRound].asset.points;
          } else {
            game.pointsT2 += 160;
          }
        } else if(game.rounds[game.currentRound].teamSpeaker === 2){
          if (game.rounds[game.currentRound].pointsT2 >= game.rounds[game.currentRound].asset.points){
            game.pointsT2 += game.rounds[game.currentRound].asset.points;
          } else {
            game.pointsT1 += 160;
          }
        }
        if(game.maxPoints <= game.pointsT1 || game.maxPoints <= game.pointsT2){
          const stmt1 = db.prepare('UPDATE contree SET isFinished=? WHERE ident=?');
          console.log('[!]#' + chalk.red.bold(game.ident), ' Finished');
          stmt1.run("true", ident);
        } else changeRound(game);
      }
    }
    console.log('[!]#' + chalk.greenBright.bold(game.ident), '[ROUNDS] Card played - Updated');
    game = stmt.get(ident);
    io.emit('update-game', game);
  });
});

function getChoice(game){
  const choices = [game.player1.choice, game.player2.choice, game.player3.choice, game.player4.choice].filter( (el) => { return el !== ""; });
  const choice = mostRecurring(choices);
  return ( choice === 'king')? {value: 'king', title: 'Tirage des rois'} : {value: 'mates', title: 'Séléctionnez votre équipier'};
}

function mostRecurring(arr){
  return arr.sort((a,b) => arr.filter(v => v===a).length - arr.filter(v => v===b).length ).pop();
}

function startSortByKingTeam(game){
  const stmt = db.prepare('SELECT * FROM contree WHERE ident=? LIMIT 1');
  console.log('[!]#' + chalk.yellow.bold(game.ident), chalk.cyan('Starting sort by King'));
  let tmp = 1;
  for (let i = 0; i < game.startDeck.length; i++) {
    switch(tmp){
      case 1:
        if(game.player4.deck.length < 1 || game.player4.deck[game.player4.deck.length-1].value !== 'K') {
          game.player4.deck.push(game.startDeck.shift());
        }
        break;
      case 2:
        if(game.player3.deck.length < 1 || game.player3.deck[game.player3.deck.length-1].value !== 'K') {
          game.player3.deck.push(game.startDeck.shift());
        }
        break;
      case 3:
        if(game.player2.deck.length < 1 || game.player2.deck[game.player2.deck.length-1].value !== 'K') {
          game.player2.deck.push(game.startDeck.shift());
        }
        break;
      case 4:
        if(game.player1.deck.length < 1 || game.player1.deck[game.player1.deck.length-1].value !== 'K') {
          game.player1.deck.push(game.startDeck.shift());
        }
        break;
      default:
        break;
    }
    tmp += 1;
    if(tmp === 5) tmp = 1;
  }
  console.log('[!]#' + chalk.greenBright.bold(game.ident), '[SORT] Finished');
  if( game.player1.deck[game.player1.deck.length-1].color === game.player2.deck[game.player2.deck.length-1].color ){
    game.team.T1P1 = game.player1.username;
    game.team.T1P2 = game.player2.username;
    game.team.T2P1 = game.player3.username;
    game.team.T2P2 = game.player4.username;
  } else if( game.player1.deck[game.player1.deck.length-1].color === game.player3.deck[game.player3.deck.length-1].color ){
    game.team.T1P1 = game.player1.username;
    game.team.T1P2 = game.player3.username;
    game.team.T2P1 = game.player2.username;
    game.team.T2P2 = game.player4.username;
  } else if( game.player1.deck[game.player1.deck.length-1].color === game.player4.deck[game.player4.deck.length-1].color ){
    game.team.T1P1 = game.player1.username;
    game.team.T1P2 = game.player4.username;
    game.team.T2P1 = game.player2.username;
    game.team.T2P2 = game.player3.username;
  }
  const stmt1 = db.prepare('UPDATE contree SET isTeamSet=?, team=? WHERE ident=?');
  stmt1.run("true", JSON.stringify(game.team), game.ident);
  let newGame = stmt.get(game.ident);
  firstDistribute(newGame);
}

function firstDistribute(game){
  console.log('[!]#' + chalk.yellow.bold(game.ident), chalk.cyan('First distribute itnit'));
  game.player1 = JSON.parse(game.player1);
  game.player2 = JSON.parse(game.player2);
  game.player3 = JSON.parse(game.player3);
  game.player4 = JSON.parse(game.player4);
  game.startDeck = JSON.parse(game.startDeck);
  let tmp = 1;
  const maxKey = game.startDeck.length;
  for (let i = 0; i < maxKey; i++) {
    switch(tmp){
      case 1:
          game.player4.deck.push(game.startDeck.shift());
        break;
      case 2:
          game.player3.deck.push(game.startDeck.shift());
        break;
      case 3:
          game.player2.deck.push(game.startDeck.shift());
        break;
      case 4:
          game.player1.deck.push(game.startDeck.shift());
        break;
      default:
        break;
    }
    tmp += 1;
    if(tmp === 5) tmp = 1;
  }
  const rounds = [{
    currentSpeaker: game.player1.username,
    bids: [],
    folds: [[]],
    asset: {
      suit: '',
      points: 70
    },
    teamSpeaker: 0,
    isBidOver: false,
    isFinished: false,
    currentFold: 0,
    pointsT1: 0,
    pointsT2: 0
  }];
  const stmt1 = db.prepare('UPDATE contree SET player1=?, player2=?, player3=?, player4=?,startDeck=?, rounds=? WHERE ident=?');
  stmt1.run(JSON.stringify(game.player1), JSON.stringify(game.player2), JSON.stringify(game.player3), JSON.stringify(game.player4), JSON.stringify(game.startDeck), JSON.stringify(rounds), game.ident);
}

function setNextCurrentPlayer(game) {
  // !!! GAME.ROUNDS ET GAME.TEAM DOIVENT ÊTRE PARSÉS
  if (game.rounds[game.currentRound].currentSpeaker === game.team.T1P1) {
    game.rounds[game.currentRound].currentSpeaker = game.team.T2P2;
  } else if (game.rounds[game.currentRound].currentSpeaker === game.team.T1P2) {
    game.rounds[game.currentRound].currentSpeaker = game.team.T2P1;
  } else if (game.rounds[game.currentRound].currentSpeaker === game.team.T2P1) {
    game.rounds[game.currentRound].currentSpeaker = game.team.T1P1;
  } else if (game.rounds[game.currentRound].currentSpeaker === game.team.T2P2) {
    game.rounds[game.currentRound].currentSpeaker = game.team.T1P2;
  }
  console.log('[!]#' + chalk.yellow.bold(game.ident), chalk.greenBright('[ROUNDS] Next player set'));
  return game;
}
function testIfBidIsFinished(game){
  // !!! GAME.ROUNDS ET GAME.TEAM DOIVENT ÊTRE PARSÉS
  if (game.rounds[game.currentRound].bids.length > 0 && game.rounds[game.currentRound].currentSpeaker === game.rounds[game.currentRound].bids[game.rounds[game.currentRound].bids.length-1].username) {
    game.isBidOver = true;
    game.rounds[game.currentRound].currentSpeaker = game.currentPlayer;
    game.rounds[game.currentRound].asset.points = game.rounds[game.currentRound].bids[game.rounds[game.currentRound].bids.length-1].points;
    game.rounds[game.currentRound].asset.suit = game.rounds[game.currentRound].bids[game.rounds[game.currentRound].bids.length-1].suit;
    game.rounds[game.currentRound].teamSpeaker = getTeam(game.rounds[game.currentRound].bids[game.rounds[game.currentRound].bids.length-1].username, game.team);
  }
  return game;
}

function getTeam(username, team){
  if(team.T1P1 === username || team.T1P2 === username) return 1;
  if(team.T2P1 === username || team.T2P2 === username) return 2;
}

function saveRounds(game) {
  const stmt2 = db.prepare('UPDATE contree SET rounds=? WHERE ident=?');
  stmt2.run(JSON.stringify(game.rounds), game.ident);
}

function updatePlayer(game, player) {
  game.player1 = JSON.parse(game.player1);
  game.player2 = JSON.parse(game.player2);
  game.player3 = JSON.parse(game.player3);
  game.player4 = JSON.parse(game.player4);
  if (game.player1.username === player.username) {
    game.player1 = player;
  } else if (game.player2.username === player.username) {
    game.player2 = player;
  } else if (game.player3.username === player.username) {
    game.player3 = player;
  } else if (game.player4.username === player.username) {
    game.player4 = player;
  }
  game.player1 = JSON.stringify(game.player1);
  game.player2 = JSON.stringify(game.player2);
  game.player3 = JSON.stringify(game.player3);
  game.player4 = JSON.stringify(game.player4);
  const stmt1 = db.prepare('UPDATE contree SET player1=?, player2=?, player3=?, player4=? WHERE ident=?');
  stmt1.run(game.player1, game.player2, game.player3, game.player4, game.ident);
}

function winnerOfFold(fold, asset){
  let allCardsInt = [];
  fold.forEach((card) => {
    if (card.suit === asset.suit) { // Atout
      switch (card.value) {
        case 'V':
          allCardsInt.push({value: 8, username: card.username});
          break;
        case 9:
          allCardsInt.push({value: 7, username: card.username});
          break;
        case 'A':
          allCardsInt.push({value: 6, username: card.username});
          break;
        case 10:
          allCardsInt.push({value: 5, username: card.username});
          break;
        case 'K':
          allCardsInt.push({value: 4, username: card.username});
          break;
        case 'Q':
          allCardsInt.push({value: 3, username: card.username});
          break;
        case 8:
          allCardsInt.push({value: 2, username: card.username});
          break;
        case 7:
          allCardsInt.push({value: 1, username: card.username});
          break;
        default:
          break;
      }
    } else {
      switch (card.value) {
        case 'A':
          allCardsInt.push({value: 8, username: card.username});
          break;
        case 10:
          allCardsInt.push({value: 7, username: card.username});
          break;
        case 'K':
          allCardsInt.push({value: 6, username: card.username});
          break;
        case 'Q':
          allCardsInt.push({value: 5, username: card.username});
          break;
        case 'V':
          allCardsInt.push({value: 4, username: card.username});
          break;
        case 9:
          allCardsInt.push({value: 3, username: card.username});
          break;
        case 8:
          allCardsInt.push({value: 2, username: card.username});
          break;
        case 7:
          allCardsInt.push({value: 1, username: card.username});
          break;
        default:
          break;
      }
    }
  });
  allCardsInt.sort(function(a, b) { return a.value - b.value; });
  allCardsInt.reverse();
  const winner = allCardsInt[0].username;

  let allPoints = [];
  fold.forEach((card) =>{
    if(card.suit === asset.suit){ // Atout
      if(isNaN(card.value)){ // Si c'est une tête
        switch (card.value) {
          case 'V':
            allPoints.push({value: 20, username: card.username});
            break;
          case 'A':
            allPoints.push({value: 11, username: card.username});
            break;
          case 'K':
            allPoints.push({value: 4, username: card.username});
            break;
          case 'Q':
            allPoints.push({value: 3, username: card.username});
            break;
          default:
            break;
        }
      } else if( card.value === 9) allPoints.push({value: 14, username: card.username});
      else if ( card.value === 10) allPoints.push({value: 10, username: card.username});
    } else { // Pas atout
      if(isNaN(card.value)){ // Si c'est une tête
        switch (card.value) {
          case 'V':
            allPoints.push({value: 2, username: card.username});
            break;
          case 'A':
            allPoints.push({value: 11, username: card.username});
            break;
          case 'K':
            allPoints.push({value: 4, username: card.username});
            break;
          case 'Q':
            allPoints.push({value: 3, username: card.username});
            break;
          default:
            break;
        }
      } else if( card.value === 10) allPoints.push({value: 10, username: card.username});
    }
  });
  allPoints.sort(function(a, b) { return a.value - b.value; });
  allPoints.reverse();
  const points = allPoints.reduce(function(a, b){ return a.value + b.value; }, 0);
  return {
    username: winner,
    points: points
  };
}

function changeRound(game){
  console.log('[!]#' + chalk.yellow.bold(game.ident), chalk.cyan(' Changing round'));
  game.startDeck = getAllCards(game.rounds[game.currentRound].folds);
  const maxKey = game.startDeck.length;
  let tmp = 1;
  if(game.currentPlayer === game.team.T1P1){
    tmp = 2;
  } else if(game.currentPlayer === game.team.T1P2){
    tmp = 4;
  } else if(game.currentPlayer === game.team.T2P2){
    tmp = 3;
  }
  for (let i = 0; i < maxKey; i++) {
    switch(tmp){
      case 1:
        game = addCardToUser(game.startDeck.shift(), game.team.T1P1, game);
        break;
      case 2:
        game = addCardToUser(game.startDeck.shift(), game.team.T2P2, game);
        break;
      case 3:
        game = addCardToUser(game.startDeck.shift(), game.team.T1P2, game);
        break;
      case 4:
        game = addCardToUser(game.startDeck.shift(), game.team.T2P1, game);
        break;
      default:
        break;
    }
    tmp += 1;
    if(tmp === 5) tmp = 1;
  }
  game.rounds[game.currentRound].isFinished = true;
  game.rounds.push({
    currentSpeaker: game.currentPlayer,
    bids: [],
    folds: [[]],
    asset: {
      suit: '',
      points: 70
    },
    teamSpeaker: 0,
    isBidOver: false,
    isFinished: false,
    currentFold: 0,
    pointsT1: 0,
    pointsT2: 0
  });
  saveRounds(game);
  game.currentRound += 1;
  const stmt2 = db.prepare('UPDATE contree SET player1=?, player2=?, player3=?, player4=?, currentPlayer=?, currentRound=?, pointsT1=?, pointsT2=? WHERE ident=?');
  stmt2.run(JSON.stringify(game.player1), JSON.stringify(game.player2), JSON.stringify(game.player3), JSON.stringify(game.player4), game.currentPlayer, game.currentRound, game.pointsT1, game.pointsT2, game.ident);
}

function addCardToUser(card, username, game){
  if(game.player1.username === username){
    game.player1.deck.push(card);
  } else if(game.player2.username === username){
    game.player2.deck.push(card);
  } else if(game.player3.username === username){
    game.player2.deck.push(card);
  } else if(game.player4.username === username){
    game.player3.deck.push(card);
  }
  return game;
}

function getAllCards(folds){
  let allCards = [];
  folds.forEach((fold) => {
    fold.forEach((card) => {
      allCards.push({suits: card.suits, value: card.value});
    });
  });
  return allCards;
}

server.listen(port, () => console.log(`Listening on port ${port}`));