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
    games.forEach(function(game){
      if(game.ident === id) {
        if(game.teammate1.length < 2) {
          game.teammate1.push({'username': username, 'IP': clientIp});
          console.log('#'+id,'[ADD MATE T1]',username, game.teammate1);
          io.emit('update-game', game);
        } else if(game.teammate2.length < 2) {
          game.teammate2.push({'username': username, 'IP': clientIp});
          console.log('#'+id,'[ADD MATE T2]',username, game.teammate2);
          io.emit('update-game', game);
        } else {
          console.log('#'+id,'[!][DID\'NT ADD MATE]',username, game);
        }
      }
    });
  });
    
  client.on('current-player', (ident) => {
    const clientIp = client.request.connection.remoteAddress;
    let selectedGame = 'no_data';
    games.forEach(function(game){
      if(game.ident === ident) selectedGame = game;
    });
    let currentPlayer = undefined;
    if(selectedGame !== 'no_data'){
        selectedGame.teammate1.forEach(function(player){
          if(player.IP === clientIp) currentPlayer = player;
        });
        selectedGame.teammate2.forEach(function(player){
          if(player.IP === clientIp) currentPlayer = player;
        });
    }
    console.log('[!]#'+ident,'Current user asked //', currentPlayer.username);
    client.emit('current-player', currentPlayer);
  });
});

const port = 8000;
io.listen(port);
console.log('Server launched, listening on port ', port);