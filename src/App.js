import React, { Component } from 'react';
import { Line } from 'rc-progress';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';

import './App.css';

const notJackieUrls = [
  'kelsey.jpg',
  'poe.jpg',
  'toothpaste.jpg',
  'pizza.jpg',
  'lamp.jpg',
  'bruce.jpg',
  'yao.jpg',
  'xi.jpg',
  'ken.jpg',
  'john.jpg',
]

function preloadImage(url) {
  const img = new Image();
  img.src = url;
}

function setup() {
  notJackieUrls.forEach((url) => {
    preloadImage(`photos/${url}`);
  })
  for (let i = 2; i < 26; i ++ ) {
    preloadImage(`photos/jackie${i}.jpg`);
  }
}


setup();

class App extends Component {
  render() {
    return (
      <div className="container-fluid">
        <div className="title">It's not <span className="jackieTitle">Jackie Chan</span></div>
          <Board />
      </div>
    );
  }
}

class Board extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.startGame = this.startGame.bind(this);
    this.generatePieces = this.generatePieces.bind(this);
  }
  componentDidMount() {
    this.startGame();
  }
  generatePieces(level) {
    const imageNumbers = Array.from(Array(22).keys());
    let pieces = [];
    const notJackie = Math.floor(Math.random() * 16);
    for (let i = 0; i < 16; i ++) {
      let url;
      if (i === notJackie) {
        url = `photos/${notJackieUrls[level]}`;
      }
      else {
        const rand = Math.floor(Math.random() * imageNumbers.length);
        // good images: 2-24
        const imageNumber = Number(imageNumbers.splice(rand, 1)) + 2;
        url = `photos/jackie${imageNumber}.jpg`;
      }
      pieces.push(
        <Piece
          onClick={this.clickPiece.bind(this, i === notJackie, url)}
          key={i}
          url={url}
        />
      );
    }
    return pieces;
  }
  clickPiece(isJackie, url) {
    if (this.state.gameOver) {
      return;
    }
    if (isJackie) {
      const nextLevel = this.state.level + 1;
      if (nextLevel > this.state.bestLevel) {
        localStorage.setItem('best', nextLevel);
        this.setState({
          bestLevel: nextLevel,
        })
      }
      this.setState({
        level: nextLevel,
        pieces: this.generatePieces(nextLevel),
      });
    }
    else {
      this.setState({
        gameOver: true,
        losingUrl: url,
        losingMethod: 0,
        freezeTimer: true,
      })
    }
  }
  startGame() {
    const bestLevel = localStorage.getItem('best') ? parseInt(localStorage.getItem('best')) : 0;
    this.setState({
     level: 0,
     pieces: this.generatePieces(0),
     bestLevel,
     losingUrl: null,
     gameOver: false,
     freezeTimer: false,
    })
  }
  outOfTime() {
    this.setState({
      gameOver: true,
      losingMethod: 1,
      freezeTimer: true,
    })
  }
  render() {
    let timeFor;
    if (this.state.level === 0) {
      timeFor = 24000;
    }
    else {
      timeFor = 6000 - this.state.level * 500; 
    }
    return (
      <div className="board">
        <div className="row scoreheader">
          <div className="directions col-xs-12 col-sm-7">Find the one person that isn't <b>Jackie</b>!</div>
          <div className="col-xs-12 col-sm-5 scores">
            <LevelScore level={this.state.level} />
            <LevelScore best={true} level={this.state.bestLevel} />
          </div>
        </div>
        <div className="subheader">
          <Timer freeze={this.state.freezeTimer} onFinish={() => this.outOfTime()} timeFor={timeFor} />
        </div>
        <div className="gameScreen">
          {

            // this.state.gameOver && <GameOverScreen url={this.state.losingUrl} method={this.state.losingMethod}/>
          }
          <div className={`pieceContainer ${this.state.gameOver ? 'gameOver' : ''}`}>
            {this.state.pieces}
          </div>
        </div>
      </div>
      
    )
  }
}

class Timer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: props.timeFor,
    }
    this.update = this.update.bind(this);
    this.startTimer = this.startTimer.bind(this);
    this.restartTimer = this.restartTimer.bind(this);
  }
  componentDidMount() {
    this.startTimer();
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.freeze) {
      clearInterval(this.interval);
    }
    else {
      this.setState({
        currentTime: nextProps.timeFor,
      }, () => {
        this.restartTimer();
      })
    }
  }
  startTimer() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(this.update, 10);
    this.startTime = Date.now();
  }
  restartTimer() {
    clearInterval(this.interval);
    this.startTimer();
  }
  update() {
    if (this.state.currentTime < 0) {
      this.setState({
        currentTime: 0
      });
      clearInterval(this.interval);
      this.props.onFinish();
    }
    this.setState({
      currentTime: this.props.timeFor - (Date.now() - this.startTime)
    })
  }
  render() {
    // weird hack to get rc-component to start immediately and end at the right time
    const percentComplete = this.state.currentTime / this.props.timeFor * 100 - 2;
    return (
      <Line
        className="timer"
        percent={percentComplete}
        strokeWidth={4}
        strokeColor={'#446CB3'}
        trailColor={'#DADFE1'}

      />
    )
  }
}

class Piece extends Component {
  render() {
    return (
      <div 
        onClick={this.props.onClick}
        style={{backgroundImage: `url(${this.props.url})`}}
        className="piece"
      />
    )
  }
}

class GameOverScreen extends Component {
  render() {
    let errorMessage;
    // wrong piece
    if (this.props.method === 0) {
      errorMessage = (
        <span>That's Jackie Chan!</span>
      )
    }
    // out of time
    else if (this.props.method === 1) {
      errorMessage = (
          <span>Time has run out</span>
      )
    }
    return (
      <div className="gameOverScreen">
        <div className="gameOverTitle">
          Game over
        </div>
        {
          this.props.url &&
          (
            <div 
              onClick={this.props.onClick}
              style={{backgroundImage: `url(${this.props.url})`}}
              className="piece"
            />
          )
        }
        <div className="errorMessage">
          {errorMessage}
        </div>
      </div>
    )
  }
}

class LevelScore extends Component {
  componentWillReceiveProps(nextProps) {

  }
  render() {
    return (
      <CSSTransitionGroup
        transitionName="score"
        transitionAppear={true}
        transitionAppearTimeout={700}
      >
        <div className="bestSscore currentScore">
          {this.props.best ? 'Best' : 'Level'}: {this.props.level + 1}
        </div>
      </CSSTransitionGroup>
    );
  }
}

export default App;
