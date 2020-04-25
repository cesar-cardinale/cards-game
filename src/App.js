import React, { Component } from 'react';
import { BrowserRouter, Route } from "react-router-dom";
import logo from './assets/img/logo.png';
import logoWhite from './assets/img/logo_w.png';
import load from './assets/img/load.gif';
import { Game } from './Game';
import useWindowDimensions from './hooks/useWindowDimensions';
import Confetti from 'react-confetti'
import './assets/css/App.css';
import './assets/css/FontAwesome.css';
import './assets/css/Animate.css';

class App extends Component {
	render() {
		return (
			<BrowserRouter>
				<Route exact path="/" component={Menu}/>
				<Route exact path="/Contree" component={ContreeMenu}/>
				<Route exact path="/Contree/Start" component={ContreeStart}/>
				<Route exact path="/Contree/Join" component={ContreeJoin}/>
				<Route exact path="/Contree/Join/:ident" component={ContreeUsername}/>
				<Route exact path="/Contree/Play/:ident" component={ContreePlay}/>
			</BrowserRouter>
		);
	}
}

class Menu extends React.Component {
	componentDidMount() {
		document.querySelector('html').classList.add("white_bg");
	}
	render()  {
		return (
			<div className="box menu">
				<Logo />
				<Button link="/Contree" classTitle="game" text="Contrée" />
				{/* <Button link="/Belote" classTitle="game" text="Belote" /> */}
			</div>
		);
	}
}

class ContreeMenu extends React.Component {
	componentDidMount() {
		document.querySelector('html').classList.add("white_bg");
	}

	render()  {
		return (
			<div className="box contree">
				<Logo />
				<h2>Contrée</h2>
				<div className="sep"/>
				<BackButton link="/"/>
				<Button link="/Contree/Start" classTitle="create" text="Créer une partie" />
				<Button link="/Contree/Join" classTitle="join" text="Rejoindre une partie" />
			</div>
		);
	}
}
class ContreeStart extends React.Component {
	constructor(props) {
		super(props);
		this.state = {private: true, maxPoints: 400};

		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}
	componentDidMount(){
		document.title = "Contrée - Création";
		document.querySelector('html').classList.add("white_bg");
	}

	handleInputChange(event) {
		const target = event.target;
		let tmp;
		if(target.name === 'private' && target.checked){
			tmp = 1;
		} else if(target.name === 'private' && !target.checked){
			tmp = 0;
		} else {
			tmp = parseInt(Math.round(target.value / 50) * 50);
		}
		const value = tmp;
		const name = target.name;

		this.setState({
			[name]: value
		});
	}

	handleSubmit(event) {
		event.preventDefault();
		if(this.state.maxPoints >= 400){
			let ident = Math.random().toString(36).substring(2, 10);
			const game = new Game(ident, this.state.private, this.state.maxPoints);
			game.send();
			this.props.history.replace('/Contree/Join/'+game.ident);
		}
	}
	render()  {
		return (
			<div className="box contree start">
				<Logo />
				<h2>Contrée</h2>
				<div className="sep"/>
				<BackButton link="/Contree"/>
				<h3>Création de la partie</h3>
				<form onSubmit={this.handleSubmit}>
					<label>
						Partie privée
						<input
							name="private"
							type="checkbox"
							checked={this.state.private}
							onChange={this.handleInputChange} />
					</label>
					<div className="private">Si cette case est cochée, seuls les joueurs disposant du lien pourront rejoindre cette partie.</div>
					<br />
					<label>
						Nombre max de points à atteindre
						<input
							name="maxPoints"
							type="number"
							min="400"
							step="50"
							value={this.state.maxPoints}
							onChange={this.handleInputChange} />
					</label>
					<input type="submit" className="button" value="Créer" />
				</form>
			</div>
		);
	}
}

class ContreeJoin extends React.Component {
	constructor(props) {
		super(props);
		this.state = {games: []};

		this.handleAllGames = this.handleAllGames.bind(this);
		this.handleRedirect = this.handleRedirect.bind(this);
	}
	componentDidMount(){
		document.title = "Contrée - Rejoindre";
		document.querySelector('html').classList.add("white_bg");
		Game.getAllGamesJoinable(this.handleAllGames);
	}

	handleAllGames(allGames) {
		console.log(allGames);
		if(allGames.length > 0) this.setState((state, props) => ({games: allGames}));
	}
	handleRedirect(ident){
		const link = '/Contree/Join/'+ident;
		this.props.history.replace(link);
		document.location.reload(true);
	}
	render()  {
		return (
			<div className="box contree join">
				<Logo />
				<h2>Contrée</h2>
				<div className="sep"/>
				<BackButton link="/Contree"/>
				<h3>Rejoindre une partie</h3>
				<ul>
					<GamesList games={this.state.games} handleRedirect={this.handleRedirect}/>
				</ul>
			</div>
		);
	}
}

class ContreeUsername extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			ident: this.props.match.params.ident,
			game: new Game(this.props.match.params.ident, null, null),
			username: "",
			currentPlayer: null,
			cantContinue: true
		};

		this.handleLiveGame = this.handleLiveGame.bind(this);
		this.handlePlayerIsAlreadyInGame = this.handlePlayerIsAlreadyInGame.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}
	componentDidMount(){
		document.title = "Contrée - Partie #"+this.state.game.ident;
		document.querySelector('html').classList.add("white_bg");
		this.state.game.populate( this.handleLiveGame );
		this.state.game.getCurrentPlayer(this.handlePlayerIsAlreadyInGame);
	}
	handleLiveGame(game){
		this.setState((state) => ({game: Object.assign(state.game, game)}) );
		if(this.state.game.player1 && this.state.game.player1.username && this.state.game.player2 && this.state.game.player2.username && this.state.game.player3 && this.state.game.player3.username && this.state.game.player4 && this.state.game.player4.username){
			document.getElementById('buttonCapacity').classList.add('show');
			document.getElementById('form').style.display = 'none';
			document.querySelector('h3').style.display = 'none';
		}
		if(this.state.game.ident !== this.state.ident) this.props.history.replace('/Contree');
	}

	handlePlayerIsAlreadyInGame(player){
		if(player !== null && this.props.history.action === 'POP') this.props.history.replace('/Contree/Play/'+this.state.game.ident);
		document.location.reload(true);
	}

	handleChange(event) {
		const target = event.target;
		const value = target.value.replace(/\s/g, '').toLowerCase();

		this.setState({ username: value });
		let found = false;
		if( (this.state.game.player1 && this.state.game.player1.username === value) ||
			(this.state.game.player2 && this.state.game.player2.username === value) ||
			(this.state.game.player3 && this.state.game.player3.username === value) ||
			(this.state.game.player4 && this.state.game.player4.username === value) ){
			found = true;
		}
		if(found){
			document.getElementById('used').classList.add('show');
			this.setState({ cantContinue: true });
		} else if(value.length < 5){
			document.getElementById('used').classList.remove('show');
			this.setState({ cantContinue: true });
		} else{
			document.getElementById('used').classList.remove('show');
			this.setState({ cantContinue: false });
		}
	}

	handleSubmit(event) {
		event.preventDefault();
		this.state.game.addMate(this.state.username);
		this.props.history.replace('/Contree/Play/'+this.state.ident);
	}

	render()  {
		return (
			<div className="box contree username">
				<Logo />
				<h2>Contrée</h2>
				<div className="sep"/>
				<h3>Joindre la partie #{this.state.ident}</h3>
				<div className="sep"/>
				<h3>Nom d'utilisateur</h3>
				<form id="form" onSubmit={this.handleSubmit}>
					<input type="text" name="username" value={this.state.username} onChange={this.handleChange} />
					<div id="used"><span>{this.state.username}</span> est déjà utilisé</div>
					<input type="submit" id="buttonStart" className="button" value="Commencer" disabled={this.state.cantContinue} />
				</form>
				<span id="buttonCapacity">
				<BackButton link="/Contree"/>
				<div className="button start">Cette partie est déjà pleine, vous ne pouvez pas la rejoindre</div>
				</span>
			</div>
		);
	}
}

class ContreePlay extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			ident: this.props.match.params.ident,
			game: new Game(this.props.match.params.ident, null, null),
			currentPlayer: undefined,
			lastUpdate: null
		};
		this.handleLiveGame = this.handleLiveGame.bind(this);
		this.handleCurrentPlayer = this.handleCurrentPlayer.bind(this);
		this.getMate = this.getMate.bind(this);
		this.chooseKing = this.chooseKing.bind(this);
		this.chooseMate = this.chooseMate.bind(this);
		this.setTeam = this.setTeam.bind(this);
		this.handleBid = this.handleBid.bind(this);
		this.handlePassBid = this.handlePassBid.bind(this);
		this.handleCard = this.handleCard.bind(this);
	}
	componentDidMount(){
		this.state.game.populate(this.handleLiveGame);
		this.state.game.onUpdate(this.handleLiveGame);
		this.state.game.getCurrentPlayer(this.handleCurrentPlayer);
		setInterval(() => this.checkIfNoUpdate(), 5000);
		document.title = "Contrée - Partie #"+this.state.game.ident;
		document.querySelector('html').classList.remove("white_bg");
		document.querySelector('html').classList.add("black_bg");
		if(document.querySelector('.logo img')) document.querySelector('.logo img').setAttribute("src", logoWhite);
	}
	handleLiveGame(game){
		this.setState(() => ({lastUpdate: Date.now()}));
		if(game.ident === this.state.ident) {
			game.team = JSON.parse(game.team);
			game.isTeamSet = JSON.parse(game.isTeamSet);
			game.player1 = JSON.parse(game.player1);
			game.player2 = JSON.parse(game.player2);
			game.player3 = JSON.parse(game.player3);
			game.player4 = JSON.parse(game.player4);
			game.startDeck = JSON.parse(game.startDeck);
			game.rounds = JSON.parse(game.rounds);
			game.isFinished = JSON.parse(game.isFinished);
			this.setState((state) => ({game: Object.assign(state.game, game)}));
		}
		if (this.state.game.ident !== this.state.ident) this.props.history.replace('/Contree');
	}
	checkIfNoUpdate(){
		const date = new Date();
		if(date - this.state.lastUpdate > 10*1000){
			console.log('update needed');
			this.state.game.sendUpdateNeeded();
		}
	}
	handleCurrentPlayer(player){
		if(player) {
			this.setState((state, props) => ({currentPlayer: player}));
		}
		if(this.state.currentPlayer === null && this.props.history.action === 'POP') this.props.history.replace('/Contree/Join/'+this.state.game.ident);
	}
	getMate(place){
		if(this.state.currentPlayer !== null && this.state.currentPlayer !== undefined && place === 'me'){
			return( this.player(this.state.currentPlayer.username) );
		}
		if(this.state.currentPlayer !== null && this.state.currentPlayer !== undefined){
			let selectedUser;
			let myTeam = 0;
			const username = this.state.currentPlayer.username;
			if(this.state.game.team.T1P1 && this.state.game.team.T1P1 === username){
				myTeam = 1;
				selectedUser = this.state.game.team.T1P2;
			} else if(this.state.game.team.T1P2 && this.state.game.team.T1P2 === username){
				myTeam = 1;
				selectedUser = this.state.game.team.T1P1;
			} else if(this.state.game.team.T2P1 && this.state.game.team.T2P1 === username){
				myTeam = 2;
				selectedUser = this.state.game.team.T2P2;
			} else if(this.state.game.team.T2P2 && this.state.game.team.T2P2 === username){
				myTeam = 2;
				selectedUser = this.state.game.team.T2P1;
			}
			if(selectedUser && place === 'mate'){
				return this.player(selectedUser);
			}
			if(myTeam !== 2 && (place === 'first' || place === 'second') ){
				if(this.state.game.team.T2P1 && this.state.game.team.T2P1 !== username && place === 'first') return this.player(this.state.game.team.T2P1);
				if(this.state.game.team.T2P2 && this.state.game.team.T2P2 !== username && place === 'second') return this.player(this.state.game.team.T2P2);
			} else if(myTeam !== 1 && (place === 'first' || place === 'second') ){
				if(this.state.game.team.T1P1 && this.state.game.team.T1P1 !== username && place === 'first') return this.player(this.state.game.team.T1P1);
				if(this.state.game.team.T1P2 && this.state.game.team.T1P2 !== username && place === 'second') return this.player(this.state.game.team.T1P2);
			}
		}
		return( {username: "", IP: null, choice: null} );
	}

	player(username){
		if(this.state.game.player1 && this.state.game.player1.username === username){
			return this.state.game.player1;
		} else if(this.state.game.player2 && this.state.game.player2.username === username){
			return this.state.game.player2;
		} else if(this.state.game.player3 && this.state.game.player3.username === username){
			return this.state.game.player3;
		} else if(this.state.game.player4 && this.state.game.player4.username === username){
			return this.state.game.player4;
		}
	}

	chooseKing(){
		document.querySelector('#choices').remove();
		this.state.game.setChoice(this.handleLiveGame, this.handleCurrentPlayer, 'king', this.state.currentPlayer.username);
	}
	chooseMate(){
		document.querySelector('#choices').remove();
		this.state.game.setChoice(this.handleLiveGame, this.handleCurrentPlayer, 'mates', this.state.currentPlayer.username);
	}
	watingView(){
		if( (this.state.game.player1 && this.state.game.player1.choice && this.state.game.player2 && this.state.game.player2.choice && this.state.game.player3 && this.state.game.player3.choice && this.state.game.player4 && this.state.game.player4.choice) || this.state.game.isTeamSet ) return '';
		const me = this.getMate('me');
		const mate = this.getMate('mate');
		const adv1 = this.getMate('first');
		const adv2 = this.getMate('second');
		let choices = null;
		let title = "En attente de tous les joueurs ...";
		if( me && !me.choice && mate.IP && adv1.IP && adv2.IP) {
			choices = <div id="choices"><ChoiceButton classTitle="first" event={this.chooseKing} text="Tirer les rois"/><ChoiceButton classTitle="" event={this.chooseMate} text="Choisir son équipier"/></div>;
			title = "Choix d'attribution des équipes";
		}
		if(me) {
			return (
				<div id="wait">
					<h2>{title}</h2>
					<div className="players">
						<div className="player">
							<div className="avatar"><Avatar username={me.username}/></div>
							<p>Joueur 1 (moi)</p>
							<p className="username">{me.username}</p>
							<ChoiceFlag user={me}/>
						</div>
						<div className="player">
							<div className="avatar"><Avatar username={mate.username}/></div>
							<p>Joueur 2</p>
							<p className="username">{mate.username}</p>
							<ChoiceFlag user={mate}/>
						</div>
						<div className="player">
							<div className="avatar"><Avatar username={adv1.username}/></div>
							<p>Joueur 3</p>
							<p className="username">{adv1.username}</p>
							<ChoiceFlag user={adv1}/>
						</div>
						<div className="player">
							<div className="avatar"><Avatar username={adv2.username}/></div>
							<p>Joueur 4</p>
							<p className="username">{adv2.username}</p>
							<ChoiceFlag user={adv2}/>
						</div>
					</div>
					{choices}
				</div>
			);
		}
	}
	choiceView(){
		if(this.state.game.player1 && this.state.game.player1.choice && this.state.game.player2 && this.state.game.player2.choice && this.state.game.player3 && this.state.game.player3.choice && this.state.game.player4 && this.state.game.player4.choice && !this.state.game.isTeamSet){
			const choice = this.state.game.getChoice(); //{value: 'mates', title: 'Séléctionnez votre équipier'}; //{value: 'king', title: 'king'}; //
			const me = this.getMate('me');
			const mate = this.getMate('mate');
			const adv1 = this.getMate('first');
			const adv2 = this.getMate('second');
			let scene;
			//if(choice.value === 'king') scene = this.choiceKingScene(me, mate, adv1, adv2); Pas d'animation pour le moment
			if(choice.value === 'mates') scene = this.choiceMatesScene(me, mate, adv1, adv2);
			return(
				<div id="choice">
					<h2>{choice.title}</h2>
					{scene}
				</div>
			);
		} else return '';
	}
	setTeam(me, mate, adv1, adv2){
		this.state.game.setTeam(me, mate, adv1, adv2);
	}
	choiceMatesScene(me, mate, adv1, adv2){
		return(
			<div id="mates_scene">
				<div className="players">
					<button onClick={() => {this.setTeam(me.username, mate.username, adv1.username, adv2.username)}}>
						<Player user={mate} />
					</button>
					<button onClick={() => {this.setTeam(me.username, adv1.username, mate.username, adv2.username)}}>
						<Player user={adv1} />
					</button>
					<button onClick={() => {this.setTeam(me.username, adv2.username, adv1.username, mate.username)}}>
						<Player user={adv2} />
					</button>
				</div>
			</div>
		);
	}
	gameView(){
		if( !this.state.game.player1 || !this.state.game.player2 || !this.state.game.player3 || !this.state.game.player4 || !this.state.game.isTeamSet || this.state.game.isFinished ) return '';
		const me = this.getMate('me');
		const mate = this.getMate('mate');
		const adv1 = this.getMate('first');
		const adv2 = this.getMate('second');
		const [myPoints, theirPoints] = this.getPoints('mine', me.username);
		if(!this.state.game.rounds[this.state.game.currentRound].isBidOver){
			me.lastBid = this.state.game.getLastBid(me.username);
			mate.lastBid = this.state.game.getLastBid(mate.username);
			adv1.lastBid = this.state.game.getLastBid(adv1.username);
			adv2.lastBid = this.state.game.getLastBid(adv2.username);
		}
		return(
			<div id="game_view" className={(this.state.game.rounds[this.state.game.currentRound].currentSpeaker === me.username && !this.state.game.rounds[this.state.game.currentRound].isBidOver)? 'me_bid': (this.state.game.rounds[this.state.game.currentRound].currentSpeaker === me.username && this.state.game.rounds[this.state.game.currentRound].isBidOver)? 'me_round': ''}>
				<Teams me={me.username} mate={mate.username} adv1={adv1.username} adv2={adv2.username} myPoints={myPoints} theirPoints={theirPoints} current={this.state.game.currentPlayer} teamSpeaker={this.state.game.rounds[this.state.game.currentRound].teamSpeaker} teamSpeakerBid={{suit: this.state.game.rounds[this.state.game.currentRound].asset.suit, points: this.state.game.rounds[this.state.game.currentRound].asset.points}}/>
				<table>
					<tbody>
					<tr>
						<td />
						<td className={(this.state.game.rounds[this.state.game.currentRound].currentSpeaker === mate.username)? 'current': ''}><Player user={mate} />{(mate.lastBid)? <LastBidMate bid={mate.lastBid} />: ''}</td>
						<td>{(this.state.game.rounds[this.state.game.currentRound].currentFold > 0)? <BeautifyFold fold={this.state.game.rounds[this.state.game.currentRound].folds[this.state.game.rounds[this.state.game.currentRound].currentFold-1]} /> : ''}</td>
					</tr>
					<tr>
						<td className={(this.state.game.rounds[this.state.game.currentRound].currentSpeaker === adv1.username)? 'current': ''}>{(adv1.lastBid)? <LastBid bid={adv1.lastBid} />: ''}<Player user={adv1} /></td>
						<td className="center">{(!this.state.game.rounds[this.state.game.currentRound].isBidOver)? <h2 className="fake_card">Choix de l'atout</h2> : <BeautifyFold fold={this.state.game.rounds[this.state.game.currentRound].folds[this.state.game.rounds[this.state.game.currentRound].currentFold]} />}</td>
						<td className={(this.state.game.rounds[this.state.game.currentRound].currentSpeaker === adv2.username)? 'current': ''}>{(adv2.lastBid)? <LastBid bid={adv2.lastBid} />: ''}<Player user={adv2} /></td>
					</tr>
					</tbody>
				</table>
				{(!this.state.game.rounds[this.state.game.currentRound].isBidOver && this.state.game.rounds[this.state.game.currentRound].currentSpeaker === me.username)? <Bid min={(this.state.game.rounds[this.state.game.currentRound].bids.length > 0)? this.state.game.rounds[this.state.game.currentRound].bids[this.state.game.rounds[this.state.game.currentRound].bids.length-1].points : 70} handleBid={this.handleBid} handlePass={this.handlePassBid} /> : ''}
				{(me.lastBid)? <LastBid bid={me.lastBid} />: ''}
				<BeautifyDeck handleClick={this.handleCard} cards={this.state.game.sortMyDeck(me.deck, this.state.game.rounds[this.state.game.currentRound].asset)} />
			</div>
		);
	}
	getPoints(who, me){
		if(who === 'mine'){
			if(me === this.state.game.team.T1P1 || me === this.state.game.team.T1P2){
				return [this.state.game.pointsT1, this.state.game.pointsT2];
			} else {
				return [this.state.game.pointsT2, this.state.game.pointsT1];
			}
		}
		return [0, 0];
	}
	handleBid(points){
		const color = document.querySelector('.bid .colors input[name=color]:checked');
		if(color && this.state.game.rounds[this.state.game.currentRound].currentSpeaker === this.state.currentPlayer.username){
			this.state.game.rounds[this.state.game.currentRound].bids.push({points: points, suit: color.value, username: this.state.currentPlayer.username});
			this.state.game.newBid();
			console.log(points, color.value);
			document.querySelector('.me_bid').classList.remove('me_bid');
			animateCSS('.bid', 'fadeOutDown', function() { document.querySelector('.bid').remove(); });
		}
	}
	handlePassBid(){
		if(this.state.game.rounds[this.state.game.currentRound].currentSpeaker === this.state.currentPlayer.username){
			this.state.game.passBid();
		}
	}
	handleCard(card){
		this.state.game.cardPlayedFrom(card, this.state.currentPlayer.username);
	}
	gameFinishedView(){
		let winner = '{error}';
		let looser = '{error}';
		let pointsWinner = 0;
		let pointsLooser = 0;
		if(this.state.game.pointsT1 >= this.state.game.maxPoints){
			winner = this.state.game.team.T1P1+' & '+this.state.game.team.T1P2;
			looser = this.state.game.team.T2P1+' & '+this.state.game.team.T2P2;
			pointsWinner = this.state.game.pointsT1;
			pointsLooser = this.state.game.pointsT2;
		} else if(this.state.game.pointsT2 >= this.state.game.maxPoints){
			winner = this.state.game.team.T2P1+' & '+this.state.game.team.T2P2;
			looser = this.state.game.team.T1P1+' & '+this.state.game.team.T1P2;
			pointsWinner = this.state.game.pointsT2;
			pointsLooser = this.state.game.pointsT1;
		}
		const button = <button onClick={this.props.history.replace('/Contree')} className={`button returnToMenu`}>Retour au menu</button>;
		return (
			<div className="finished">
				<ConfettiSet />
				<div className="box">
					<div className="logoBlack"><a href="/"><img src={logo} alt="logo"/></a></div>
					<h2>Bravo à {winner}</h2>
					<h3>contre {looser}</h3>
					<div><span className="winner">{pointsWinner}</span> à <span className="looser">{pointsLooser}</span></div>
					{button}
				</div>
			</div>
		);
	}
	render()  {
		console.log('JEU', this.state.game);
		if(this.state.game.isFinished) return( this.gameFinishedView() );
		return (
			<div className='box contree play'>
				<Logo />
				<h2>Contrée - Partie #{this.state.game.ident}</h2>
				<div className="sep"/>
				<BackButton link="/Contree/Join"/>
				<InputShareLink link={`/Contree/Join/${this.state.game.ident}`} />
				{this.watingView()}
				{this.choiceView()}
				{this.gameView()}
			</div>
		);
	}
}

const Logo = () => <div className="logo"><div><a href="/"><img src={logo} alt="logo"/></a></div></div>;

const Button = ({ link, classTitle, text }) => <a href={link}><div className={`button ${classTitle}`}>{text}</div></a>;

const ChoiceButton = ({ classTitle, event, text }) => <button onClick={event} className={`button choice ${classTitle}`}>{text}</button>;

const BackButton = ({ link }) => <a href={link} className="back"><div><i className="fas fa-arrow-circle-left" /> Retour</div></a>;

const InputShareLink = ({ link }) => <div className="shareInput">Inviter <i className="fas fa-share-square" /> <input type="text" value={`http://`+window.location.hostname+`${link}`} disabled/></div>;

const Player = ({user}) => <div className="player"><div className="avatar"><Avatar username={user.username}/></div><p className="username">{user.username}</p></div>;

const Avatar = ({username}) => (username)? <img alt={`Avatar de ${username}`} src={`https://api.adorable.io/avatars/285/${username}`} /> : <img className="load" alt="En attente" src={load} />;

const Card = ({handleClick, card}) => (card)? <button onClick={() => handleClick(card)} className={`card ${card.suit}`}><div className="topValue">{card.value}</div><div className="bottomValue">{card.value}</div></button> : '';

const BeautifyDeck = ({handleClick, cards}) => (cards)? <ul className="deck"><Deck handleClick={handleClick} cards={cards} /></ul> : null;

const Deck = ({handleClick, cards}) => cards.map((card) => <li key={`${card.suit.toString()}_${card.value.toString()}`}><Card handleClick={handleClick} card={card} /></li> );

const Teams = ({me, mate, adv1, adv2, myPoints, theirPoints, current, teamSpeaker, teamSpeakerBid}) => <div className="teams"><div className="team">{me} - {mate} <span>{myPoints}</span></div><div className="team">{adv1} - {adv2}<span>{theirPoints}</span></div>{(teamSpeaker > 0)?<LastBidMate bid={teamSpeakerBid} classNameMore={`T${teamSpeaker}`} />: ''}</div>;

const Bid = ({min, handleBid, handlePass}) => <div className="bid"><h2>À votre tour de parler</h2><Colors /><div className="points"><BidPoints min={min} handleBid={handleBid} /><button className="pass" onClick={handlePass}>Passer</button></div></div>;

const BidPoints = ({min, handleBid}) => [80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180].map((points) => (points > min)? <button key={points.toString()} onClick={() => handleBid(points)}>{points}</button> : '' );

const Colors = () => <div className="colors"><label><input type="radio" name="color" value="trefle" /><div className="trefle" /></label><label><input type="radio"  name="color" value="pique" /><div className="pique" /></label><label><input type="radio" name="color" value="carreau" /><div className="carreau" /></label><label><input type="radio" name="color" value="coeur" /><div className="coeur" /></label></div>

const LastBid = ({bid}) => <div className={`lastBid ${bid.suit} fadeInUp animated`}>{bid.points}</div>;

const LastBidMate = ({bid, classNameMore}) => <div className={`lastBid ${bid.suit} mate ${classNameMore} fadeInDown animated`}>{bid.points}</div>;

const BeautifyFold = ({fold}) => (fold.length > 0)? <div className="fold"><ul><Fold cards={fold}/></ul></div>: <div className="fake_card" />;

const Fold = ({cards}) => cards.map((card) => <li><Card handleClick={null} card={card.card} /></li> );

const ConfettiSet = () => {
	const { height, width } = useWindowDimensions();
	return (<Confetti width={width} height={height} />);
}

const GamesList = ({games, handleRedirect}) => (games.length > 0)? games.map((game) => <li key={game.ident}><button onClick={() => handleRedirect(game.ident)}>
	<i className="fas fa-sign-in" /> #{game.ident} <div className="players">{[game.player1, game.player2, game.player3, game.player4].filter( (el) => el !== null ).length}
	<i className="fas fa-users" /></div></button></li> ) : '';

/**
 * @return {null}
 */
function ChoiceFlag({user}){
	if(user.choice === 'king') return <div className="choose">Veut tirer les rois</div>;
	else if(user.choice === 'mates') return <div className="choose">Veut chosir</div>;
	return null;
}

function animateCSS(element, animationName, callback) {
	const node = document.querySelector(element);
	node.classList.add('animated', animationName);
	function handleAnimationEnd() {
		node.classList.remove('animated', animationName);
		node.removeEventListener('animationend', handleAnimationEnd);
		if (typeof callback === 'function') callback();
	}
	node.addEventListener('animationend', handleAnimationEnd);
}

export default App;
