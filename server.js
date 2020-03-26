const io = require('socket.io')();
const db = require('better-sqlite3')('database.db');

io.on('connection', (client) => {
  // Ajout du nouveau jeu dans la database
  client.on('add-game', (game) => {
    const stmt = db.prepare('INSERT INTO contree (ident, isPrivate, maxPoints, team) VALUES (?, ?, ?, ?)');
    const isPrivate = (game.isPrivate)? 'true' : 'false';
    stmt.run(game.ident, isPrivate, game.maxPoints, JSON.stringify(game.team));
    console.log('[!]#'+game.ident+' added');
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
      'choice': null
    };
    const stmt = db.prepare('SELECT * FROM contree WHERE ident=? LIMIT 1');
    let game = stmt.get(ident);
    let team = JSON.parse(game.team);
    const stmtTeam = db.prepare('UPDATE contree SET team=? WHERE ident=?');
    if(!game.player1){
      const stmt1 = db.prepare('UPDATE contree SET player1=? WHERE ident=?');
      stmt1.run( JSON.stringify(player), ident );
      team[0][0] = username;
      console.log('[!]#'+ident,'[ADD P1]',username);
    } else if(!game.player2){
      const stmt1 = db.prepare('UPDATE contree SET player2=? WHERE ident=?');
      stmt1.run( JSON.stringify(player), ident );
      team[0][1] = username;
      console.log('[!]#'+ident,'[ADD P2]',username);
    } else if(!game.player3){
      const stmt1 = db.prepare('UPDATE contree SET player3=? WHERE ident=?');
      stmt1.run( JSON.stringify(player), ident );
      team[1][0] = username;
      console.log('[!]#'+ident,'[ADD P3]',username);
    } else if(!game.player4){
      const stmt1 = db.prepare('UPDATE contree SET player4=? WHERE ident=?');
      stmt1.run( JSON.stringify(player), ident );
      team[1][1] = username;
      console.log('[!]#'+ident,'[ADD P4]',username);
    }
    stmtTeam.run( JSON.stringify(team), ident );
    game = stmt.get(ident);
    io.emit('update-game', game);
  });
    
  client.on('current-player', (ident) => {
    const clientIp = client.request.connection.remoteAddress;
    const stmt = db.prepare('SELECT * FROM contree WHERE ident=? LIMIT 1');
    let game = stmt.get(ident);
    let currentPlayer = null;
    if(game.player1 && JSON.parse(game.player1).IP === clientIp){
      currentPlayer = JSON.parse(game.player1);
    } else if(game.player2 && JSON.parse(game.player2).IP === clientIp){
      currentPlayer = JSON.parse(game.player2);
    } else if(game.player3 && JSON.parse(game.player3).IP === clientIp){
      currentPlayer = JSON.parse(game.player3);
    } else if(game.player4 && JSON.parse(game.player4).IP === clientIp){
      currentPlayer = JSON.parse(game.player4);
    }
    console.log('[!]#'+ident,'Current user asked //', (currentPlayer)? currentPlayer.username : currentPlayer );
    client.emit('current-player', currentPlayer);
  });

  client.on('set-choice', (ident, username, choice) => {
    const stmt = db.prepare('SELECT * FROM contree WHERE ident=? LIMIT 1');
    let game = stmt.get(ident);
    if(game.player1){
      const player1 = JSON.parse(game.player1);
      if(player1.username === username){
        player1.choice = choice;
        const stmt1 = db.prepare('UPDATE contree SET player1=? WHERE ident=?');
        stmt1.run( JSON.stringify(player1), ident );
        console.log('[!]#'+ident,'[UPDATE P1]',username);
      }
    } else if(game.player2){
      const player2 = JSON.parse(game.player2);
      if(player2.username === username){
        player2.choice = choice;
        const stmt1 = db.prepare('UPDATE contree SET player2=? WHERE ident=?');
        stmt1.run( JSON.stringify(player2), ident );
        console.log('[!]#'+ident,'[UPDATE P2]',username);
      }
    } else if(game.player3){
      const player3 = JSON.parse(game.player3);
      if(player3.username === username){
        player3.choice = choice;
        const stmt1 = db.prepare('UPDATE contree SET player3=? WHERE ident=?');
        stmt1.run( JSON.stringify(player3), ident );
        console.log('[!]#'+ident,'[UPDATE P3]',username);
      }
    } else if(game.player4){
      const player4 = JSON.parse(game.player4);
      if(player4.username === username){
        player4.choice = choice;
        const stmt1 = db.prepare('UPDATE contree SET player4=? WHERE ident=?');
        stmt1.run( JSON.stringify(player4), ident );
        console.log('[!]#'+ident,'[UPDATE P4]',username);
      }
    }
    game = stmt.get(ident);
    io.emit('update-game', game);
  });
});

const port = 3000;
io.listen(port);
console.log('Server launched, listening on port ', port);