import React, { Component } from 'react';
import { BrowserRouter, Route } from "react-router-dom";
import logo from './assets/img/logo.png';
import logoWhite from './assets/img/logo_w.png';
import Games from './Games';
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
			const game = new Games(this.state.private, this.state.maxPoints);
			game.send();
			this.props.history.replace('/Contree/Join/'+game.getIdent());
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
		this.state = {ident: this.props.match.params.ident, game: new Games(), username: "", cantContinue: true};
		Games.getGameByIdent(this.props.match.params.ident, ((err, game) => this.handleFoundGame(game)));

		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}
	componentDidMount(){
		document.title = "Contrée - Partie #"+this.state.game.ident;
	}

	handleFoundGame(game){
		this.setState({ game: Object.assign(this.state.game, game)});
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
		this.state.game.addMate(this.state.username, ((err, thisGame) => this.handleFoundGame(thisGame)));
		this.props.history.replace('/Contree/Play/'+this.state.ident);
	}

	render()  {
		return (
			<div className="box contree username">
				<Logo />
				<h2>Contrée</h2>
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
		this.state = {ident: this.props.match.params.ident, game: new Games(), currentPlayer: null};
		Games.getGameByIdent(this.props.match.params.ident, ((err, game) => this.handleFoundGame(game)));
	}
	componentDidMount(){
		document.title = "Contrée - Partie #"+this.state.game.ident;
		document.querySelector('html').style.backgroundColor = "#3F3F3F";
		document.querySelector('.logo img').setAttribute("src", logoWhite);
	}

	handleCurrentPlayer(player){
		this.setState({currentPlayer: player});
	}
	handleFoundGame(game){
		this.setState({ game: Object.assign(this.state.game, game)});
		try {
			this.state.game.getCurrentPlayer(((err, player) => this.handleCurrentPlayer(player)));
			this.state.game.subscribeGame(((err, game) => this.handleLiveGame(game)));
		}catch (e) {
			//console.log(e);
		}
		/*
		if(this.state.game.teammate1.length < 2 || this.state.game.teammate2.length < 2){
		} else {
			document.getElementById('wait').remove();
		}
		if(this.state.game.ident !== this.state.ident) this.props.history.replace('/Contree');
		 */
	}

	handleLiveGame(thisGame){
		this.setState({ game: Object.assign(this.state.game, thisGame)});
	}
	getFirstMate(){
		console.log(this.state.teammate1);
		if(this.state.game.teammate1[0] !== undefined){
			return( this.state.game.teammate1[0].username );
		}
	}
	getSecondMate(){
		if(this.state.game.teammate1[1] !== undefined){
			return( this.state.game.teammate1[1].username );
		}
	}
	getThirdMate(){
		if(this.state.game.teammate2[0] !== undefined){
			return( this.state.game.teammate2[0].username );
		}
	}
	getCurrentMate(){
		if(this.state.currentPlayer !== undefined){
			return( this.state.currentPlayer.username );
		}
	}
	render()  {
		return (
			<div className="box contree play">
				<Logo />
				<h2>Contrée - Partie #{this.state.ident}</h2>
				<div className="sep"/>
				<BackButton link="/Contree/Join"/>
				<div id="wait">
					<div>J1 {this.getFirstMate()}</div>
					<div>J2 {this.getSecondMate()}</div>
					<div>J3 {this.getThirdMate()}</div>
					<div>ME {this.getCurrentMate()}</div>
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
