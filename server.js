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
    console.log('#'+game.ident+' called / ', game);
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
    const clientIp = client.request.connection.remoteAddress;
    games.forEach(function(game){
      if(game.ident === id) {
        if(game.teammate1.length < 2) {
          game.teammate1.push({'username': username, 'IP': clientIp});
          console.log('#'+id,'[ADD MATE T1]',username, game.teammate1);
          client.emit('game', game);
        } else if(game.teammate2.length < 2) {
          game.teammate2.push({'username': username, 'IP': clientIp});
          console.log('#'+id,'[ADD MATE T2]',username, game.teammate2);
          client.emit('game', game);
        } else {
          console.log('#'+id,'[!][DID\'NT ADD MATE]',username, game);
        }
      }
    });
  });

  client.on('getCurrentPlayer', (id) => {
    const clientIp = client.request.connection.remoteAddress;
    console.log('#'+id,'current user');
    let theGame = 'no data found';
    games.forEach(function(game){
      if(game.ident === id) theGame = game;
    });
    let curretPlayer = null;
    theGame.teammate1.forEach(function(player){
      if(player.IP === clientIP) curretPlayer = player;
    });
    theGame.teammate2.forEach(function(player){
      if(player.IP === clientIP) curretPlayer = player;
    });
    client.emit('currentPlayer', theGame);
  });




});

const port = 8000;
io.listen(port);
console.log('Server launched, listening on port ', port);