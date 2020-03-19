import React, { Component } from 'react';
import { BrowserRouter, Route, Link } from "react-router-dom";
import logo from './assets/img/logo.png';
import './assets/css/App.css';
import './assets/css/FontAwesome.css';

import { subscribeToTimer } from './api';

class App extends Component {
	constructor(props) {
		super(props);

		subscribeToTimer((err, timestamp) => this.setState({
			timestamp
		}));
	}
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
				<ul>
					<a href="/Contree"><li class="button game">Contrée</li></a>
					<a href="/Belote"><li class="button game">Belote</li></a>
				</ul>
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
				<div className="sep"></div>
				<BackButton link="/"/>
				<ul>
					<a href="/Contree/Start"><li className="button create">Creer une partie</li></a>
					<a href="/Contree/Join"><li className="button join">Rejoindre une partie</li></a>
				</ul>
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
		console.log(this.state.maxPoints);
		console.log(this.state.private);
		event.preventDefault();
	}
	render()  {
		return (
			<div className="box contree start">
				<Logo />
				<h2>Contrée</h2>
				<div className="sep"></div>
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
					<input type="submit" class="button" value="Créer" />
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

class Logo extends React.Component {
	render()  {
		return (
			<div className="logo"><a href="/"><img src={logo} alt="logo"/></a></div>
		);
	}
}

const BackButton = ({ link }) => <a href={link} className="back"><div><i className="fas fa-arrow-circle-left"></i> Retour</div></a>

export default App;
