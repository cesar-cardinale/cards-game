import React, { Component } from 'react';
import { BrowserRouter, Route } from "react-router-dom";
import logo from './assets/img/logo.png';
import logoWhite from './assets/img/logo_w.png';
import { Game } from './Game';
import './assets/css/App.css';
import './assets/css/FontAwesome.css';

// import { subscribeToTimer } from './api';
//subscribeToTimer((err, timestamp) => this.setState({ timestamp }));

class App extends Component {
	state = {
		timestamp: 'no timestamp yet'
	};

	render() {
		return (
			/*<div className="App">
              <p className="App-intro">
              Il est : {this.state.timestamp}
              </p>
            </div>*/
			<BrowserRouter>
				<Route exact path="/" component={Menu}/>
				<Route exact path="/Contree" component={ContreeMenu}/>
				<Route exact path="/Contree/Start" component={ContreeStart}/>
				<Route exact path="/Contree/Join/:ident" component={ContreeUsername}/>
				<Route exact path="/Contree/Play/:ident" component={ContreePlay}/>
				<Route exact path="/Belote" component={BeloteMenu}/>
			</BrowserRouter>
		);
	}
}

class Menu extends React.Component {
	render()  {
		return (
			<div className="box menu">
				<Logo />
				<Button link="/Contree" classTitle="game" text="Contrée" />
				<Button link="/Belote" classTitle="game" text="Belote" />
			</div>
		);
	}
}

class ContreeMenu extends React.Component {
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
	}

	handleInputChange(event) {
		const target = event.target;
		const value = target.name === 'private' ? target.checked : parseInt(Math.round(target.value/50)*50);
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

class ContreeUsername extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			ident: this.props.match.params.ident,
			game: new Game(this.props.match.params.ident, null, null),
			username: "",
			cantContinue: true
		};

        this.handleLiveGame = this.handleLiveGame.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}
    componentDidMount(){
		document.title = "Contrée - Partie #"+this.state.game.ident;
        this.state.game.populate( this.handleLiveGame );
	}
	handleLiveGame(game){
		this.setState((state, props) => ({game: Object.assign(state.game, game)}) );
        if(this.state.game.teammate1.length >= 2 && this.state.game.teammate2.length >= 2){
			document.getElementById('buttonCapacity').classList.add('show');
			document.getElementById('form').style.display = 'none';
			document.querySelector('h3').remove();
		}
		if(this.state.game.ident !== this.state.ident) this.props.history.replace('/Contree');
	}

	handleChange(event) {
		const target = event.target;
		const value = target.value;

		this.setState({ username: value });
		let found = false;
		this.state.game.teammate1.forEach(function(mate){
			if(mate === value){ found = true; }
		});
		this.state.game.teammate2.forEach(function(mate){
			if(mate === value){ found = true; }
		});
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
			currentPlayer: undefined
		};
        this.getMate = this.getMate.bind(this);
        this.handleLiveGame = this.handleLiveGame.bind(this);
        this.handleCurrentPlayer = this.handleCurrentPlayer.bind(this);
	}
	componentDidMount(){
        this.state.game.populate(this.handleLiveGame);
        this.state.game.onUpdate(this.handleLiveGame);
        this.state.game.getCurrentPlayer(this.handleCurrentPlayer);
		document.title = "Contrée - Partie #"+this.state.game.ident;
		document.querySelector('html').style.backgroundColor = "#3F3F3F";
		document.querySelector('.logo img').setAttribute("src", logoWhite);
	}
	handleLiveGame(game){
		if(game !== 'no_data') this.setState((state, props) => ({ game: game }));
	}
    handleCurrentPlayer(player){
		this.setState((state, props) => ({ currentPlayer: player }));
	}
	getMate(place){
		if(this.state.currentPlayer !== undefined && place === 'me'){
			return( this.state.currentPlayer.username );
		}
		let myTeam = 0;
		if(this.state.currentPlayer !== undefined){
            const username = this.state.currentPlayer.username;
			this.state.game.teammate1.forEach(function(player){
				if(player.username === username) myTeam = 1;
			});
			this.state.game.teammate2.forEach(function(player){
				if(player.username === username) myTeam = 2;
			});
			let temp = 0;
            let selectedUsername = "";
			if(myTeam === 1 && place === 'mate'){
				this.state.game.teammate1.forEach( function(player){ 
					if(player.username !== username ) selectedUsername = player.username;
				});
			} else if(myTeam === 2 && place === 'mate'){
				this.state.game.teammate2.forEach( function(player){ 
					if(player.username !== username ) selectedUsername = player.username;
				});
			} else if(myTeam !== 1 && (place === 'first' || place === 'second') ){
				this.state.game.teammate2.forEach( function(player){
					if(player.username !== username && place === 'first' && temp === 0) selectedUsername = player.username;
					if(player.username !== username && place === 'second' && temp === 1) selectedUsername = player.username;
					temp += 1;
				});
			} else if(myTeam !== 1 && (place === 'first' || place === 'second') ){
				this.state.game.teammate1.forEach( function(player){
					if(player.username !== username && place === 'first' && temp === 0) selectedUsername = player.username;
					if(player.username !== username && place === 'second' && temp === 1) selectedUsername = player.username;
					temp += 1;
				});
			}
            return( selectedUsername );
		}
	}
	render()  {
		console.log('JEU', this.state.game);
		return (
			<div className="box contree play">
				<Logo />
				<h2>Contrée - Partie #{this.state.game.ident}</h2>
				<div className="sep"/>
				<BackButton link="/Contree/Join"/>
				<div id="wait">
                    <h3>En attente des joueurs ...</h3>
					<div>Co equipier {this.getMate('mate')}</div>
					<div>Adv 1 {this.getMate('first')}</div>
					<div>Adv 2 {this.getMate('second')}</div>
					<div>Moi {this.getMate('me')}</div>
				</div>
			</div>
		);
	}
}






class BeloteMenu extends React.Component {
	render()  {
		return (
			<div className="box belote">
				<Logo />
				<h2>belote</h2>
			</div>
		);
	}
}

const Logo = () => <div className="logo"><div><a href="/"><img src={logo} alt="logo"/></a></div></div>;

const Button = ({ link, classTitle, text }) => <a href={link}><div className={`button ${classTitle}`}>{text}</div></a>;

const BackButton = ({ link }) => <a href={link} className="back"><div><i className="fas fa-arrow-circle-left" /> Retour</div></a>;

export default App;
