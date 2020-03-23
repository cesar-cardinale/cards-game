const io = require('socket.io')();

const games = [];
io.on('connection', (client) => {
    
    // Ajout du nouveau jeu dans le 'serveur'
  client.on('add-game', (game) => {
    games.push(game);
    console.log('[!]#'+game.ident+' added');
  });

  client.on('get-game', (ident) => {
    let selectedGame = '0';
    games.forEach(function(game){
      if(game.ident === ident) selectedGame = game;
    });
    client.emit('update-game', selectedGame);
  });

  client.on('add-mate', (id, username) => {
    const clientIp = client.request.connection.remoteAddress;
    const player = {
      'username': username,
      'IP': clientIp,
      'choice': null
    };
    games.forEach(function(game){
      if(game.ident === id) {
        if(game.teammate1.length < 2) {
          game.teammate1.push(player);
          console.log('[!]#'+id,'[ADD MATE T1]',username);
          io.emit('update-game', game);
        } else if(game.teammate2.length < 2) {
          game.teammate2.push(player);
          console.log('[!]#'+id,'[ADD MATE T2]',username);
          io.emit('update-game', game);
        } else {
          console.log('[!]#'+id,'[DID\'NT ADD MATE]',username, game);
        }
      }
    });
  });
    
  client.on('current-player', (ident) => {
    const clientIp = client.request.connection.remoteAddress;
    let selectedGame = 'no_data';
    games.forEach(function(game){
      if(game.ident === ident && selectedGame === 'no_data') selectedGame = game;
    });
    let currentPlayer = null;
    if(selectedGame !== 'no_data'){
      selectedGame.teammate1.forEach(function(user){
        console.log(user);
        if(user.IP === clientIp && currentPlayer === null) currentPlayer = user;
      });
      selectedGame.teammate2.forEach(function(user){
        if(user.IP === clientIp && currentPlayer === null) currentPlayer = user;
      });
    }
    console.log('[!]#'+ident,'Current user asked //', currentPlayer);
    client.emit('current-player', currentPlayer);
  });

  client.on('set-choice', (ident, username, choice) => {
    console.log('[!]#'+ident,'Choice catched for', username);
    let selectedGame = 'no_data';
    let indexOfGame = 0;
    let selectedIndexGame = -1;
    games.forEach(function(game){
      if(game.ident === ident && selectedGame === 'no_data' && selectedIndexGame === -1) selectedGame = game; selectedIndexGame = indexOfGame;
      indexOfGame += 1;
    });
    let team = 0;
    let indexOfPlayer = 0;
    let selectedIndexPlayer = -1;
    if(selectedIndexGame > -1){
      selectedGame.teammate1.forEach(function(user){
        if(user.username === username && selectedIndexPlayer === -1) selectedIndexPlayer
         = indexOfPlayer; team = 1;
        indexOfPlayer += 1;
      });
      indexOfPlayer = 0;
      selectedGame.teammate2.forEach(function(user){
        if(user.username === username && selectedIndexPlayer === -1) selectedIndexPlayer
            = indexOfPlayer; team = 2;
        indexOfPlayer += 1;
      });
      if(selectedIndexPlayer > -1){
        if(team === 1){
          games[selectedIndexGame].teammate1[selectedIndexPlayer].choice = choice;
        }
        if(team === 2){
          games[selectedIndexGame].teammate2[selectedIndexPlayer].choice = choice;
        }
      }
      io.emit('update-game', selectedGame);
    }
  });
});

const port = 8000;
io.listen(port);
console.log('Server launched, listening on port ', port);