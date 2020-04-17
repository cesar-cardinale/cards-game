const chalk = require('chalk');
const express = require("express");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { origins:'*:*' });
const db = require('better-sqlite3')('database.db');
const port = process.env.PORT || 4001;
const suits = ["coeur", "pique", "trefle", "carreau"];
const values = ["A", "7", "8", "9", "10", "J", "Q", "K"];

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'));
  app.get('*', (req, res) => { res.sendFile(path.resolve(__dirname, 'build', 'index.html')); });
}

io.on('connection', (client) => {
  // Ajout du nouveau jeu dans la database
  client.on('add-game', (game) => {
    const stmt = db.prepare('INSERT INTO contree (ident, isPrivate, maxPoints, player2, player3, player4, team) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const isPrivate = (game.isPrivate)? 'true' : 'false';
    stmt.run(game.ident, isPrivate, game.maxPoints, JSON.stringify(game.player2), JSON.stringify(game.player3), JSON.stringify(game.player4), JSON.stringify(game.team));
    console.log('[!]#'+chalk.greenBright.bold(game.ident)+' added');
  });

  client.on('get-game', (ident) => {
    const stmt = db.prepare('SELECT * FROM contree WHERE ident=? LIMIT 1');
    const game = stmt.get(ident);
    client.emit('update-game', game);
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
      team.T1P2 = 'test1';
      team.T2P1 = 'test2';
      team.T2P2 = 'test3';
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
      console.log(game);
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

        const choice = {value: 'mates', title: 'Séléctionnez votre équipier'}; //{value: 'king', title: 'Tirage des rois'}; //getChoice(game);
        if(choice.value === 'king') startSortByKingTeam(io, game);
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
    folds: [],
    asset: '',
    teamSpeaker: '',
    isBidOver: false
  }];
  const stmt1 = db.prepare('UPDATE contree SET player1=?, player2=?, player3=?, player4=?,startDeck=?, rounds=? WHERE ident=?');
  stmt1.run(JSON.stringify(game.player1), JSON.stringify(game.player2), JSON.stringify(game.player3), JSON.stringify(game.player4), JSON.stringify(game.startDeck), JSON.stringify(rounds), game.ident);
}

server.listen(port, () => console.log(`Listening on port ${port}`));