const io = require('socket.io')();

const games = [];
io.on('connection', (client) => {
  client.on('subscribeToTimer', (interval) => {
    console.log('client is subscribing to timer with interval ', interval);
    setInterval(() => {
      client.emit('timer', new Date());
    }, interval);
  });

  client.on('createGame', (game) => {
    games.push(game);
    console.log('Game created #'+game.ident, game);
  });

  client.on('getGame', (id) => {
    console.log('Game called #'+id);
    let theGame = 'no data found';
    games.forEach(function(game){
      if(game.ident === id) theGame = game;
    });
    client.emit('game', theGame);
  });

  client.on('addMate', (id, username) => {
    games.forEach(function(game){
      if(game.ident === id) {
        if(game.teammate.length <= 4) {
          game.teammate.push(username);
          console.log('#'+id,'[ADD MATE]',username, game);
          client.emit('game', game);
        } else {
          console.log('#'+id,'[!][DID\'NT ADD MATE]',username, game);
        }
      }
    });
  });
});

const port = 8000;
io.listen(port);
console.log('listening on port ', port);