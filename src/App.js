import React, { Component } from 'react';
import { BrowserRouter, Route } from "react-router-dom";
import logo from './assets/img/logo.png';
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
				<Route exact path="/Contree/:ident/Username" component={ContreeUsername}/>
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
			this.props.history.replace('/Contree/'+game.getIdent()+'/Username');
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
		this.state = {ident: this.props.match.params.ident, game: new Games(), username: null, canContinue: true};
		Games.getGameByIdent(this.props.match.params.ident, ((err, game) => this.handleFoundGame(game)));

		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleFoundGame(game){
		this.setState({ game: Object.assign(this.state.game, game)});
		console.log(this.state.game);
		if(this.state.game.ident !== this.state.ident) this.props.history.replace('/Contree');
	}

	handleChange(event) {
		const target = event.target;
		const value = target.value;
		const name = target.name;

		this.setState({
			[name]: value
		});
		if(value.length >= 5) this.setState({canContinue: false}); else this.setState({canContinue: true});
	}

	handleSubmit(event) {
		event.preventDefault();
		this.state.game.addMate(this.state.username, ((err, thisGame) => this.handleGameNewMate(thisGame)));
	}
	handleGameNewMate(game){
		let found = false;
		this.state.game.teammate.forEach(function(mate){
			if(mate === this.state.username) found = true;
		});
		if(!found){
			this.setState({ game: Object.assign(this.state.game, game)});
		} else {
			document.getElementById('username').classList.add('used');
		}
		if(this.state.game.ident !== this.state.ident) this.props.history.replace('/Contree');
	}

	render()  {
		return (
			<div className="box contree username">
				<Logo />
				<h2>Contrée</h2>
				<div className="sep"/>
				{ /* <BackButton link="/Contree/Start"/> */ }
				<h3>Nom d'utilisateur</h3>
				<form onSubmit={this.handleSubmit}>
					<input type="text" name="username" value={this.state.value} onChange={this.handleChange} />
					<input type="submit" className="button" value="Commencer" disabled={this.state.canContinue} />
				</form>
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

const Logo = () => <div className="logo"><a href="/"><img src={logo} alt="logo"/></a></div>;

const Button = ({ link, classTitle, text }) => <a href={link}><div className={`button ${classTitle}`}>{text}</div></a>;

const BackButton = ({ link }) => <a href={link} className="back"><div><i className="fas fa-arrow-circle-left" /> Retour</div></a>;

export default App;
