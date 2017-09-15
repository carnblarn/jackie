import React, { Component } from 'react';
import { Line } from 'rc-progress';
import { Preload } from 'react-preload';
import { notJackieUrls, jackieUrls } from './Images';
import jackieStart from './photos/jackieStart.jpg';

import './App.css';

const FREEZE_GAME = false;

class App extends Component {
  render() {
    return (
      <div className="container-fluid">
        <div className="title">It's not <span className="jackieTitle">Jackie Chan!</span></div>
          <Board />
          <div className="video">
            <span>Check out </span>
            <a href='https://www.youtube.com/watch?v=d8u4CEBVq7s'>
              <b>the video</b>
            </a>
            <span> that inspired this</span>
          </div>
          <div className="video">
            <a href='https://www.github.com/carnye/jackie'>
              <b>Github</b>
            </a>
          </div>
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
    this.reset = this.reset.bind(this);
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
        url = notJackieUrls[level];
      }
      else {
        const rand = Math.floor(Math.random() * imageNumbers.length);
        // good images: 2-24
        const imageNumber = Number(imageNumbers.splice(rand, 1));
        url = jackieUrls[imageNumber];
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
      if (nextLevel > notJackieUrls.length - 1) {
        this.setState({
          gameWon: true,
        });
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
  reset() {
    this.startGame();
  }
  render() {
    let timeFor;
    if (this.state.level === 0) {
      timeFor = 24000;
    }
    else {
      timeFor = 6000 - this.state.level * 175; 
    }
    let gameScreen;
    if (this.state.gameOver) {
      gameScreen = (
        <GameOverScreen
          url={this.state.losingUrl}
          method={this.state.losingMethod}
          reset={this.reset}
        />
      );
    } else if (this.state.gameWon) {
      gameScreen = (
        <GameWonScreen
        />
      );
    } else {
      gameScreen = (
        <div style={{height: '100%'}}>
          <div className="subheader">
            <Timer freeze={this.state.freezeTimer} onFinish={() => this.outOfTime()} timeFor={timeFor} />
          </div>
          <div className={`pieceContainer ${this.state.gameOver ? 'gameOver' : ''}`}>
            {this.state.pieces}
          </div>
        </div>
      );
    }
    return (
      <div className="board">
        <div className="scoreheader">
          <div className="directions">Find the one picture which isn't <b>Jackie Chan</b></div>
          <div className="scores">
            <LevelScore level={this.state.level} />
            <LevelScore best={true} level={this.state.bestLevel} />
          </div>
        </div>
        <div className="gameScreen">
          <Preload
            autoResolveDelay={10000}
            images={notJackieUrls.concat(jackieUrls)}
            loadingIndicator={<Loading />}
          >
            {gameScreen}
          </Preload>
        </div>
      </div>
      
    )
  }
}

class Loading extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hidden: true,
    }
  }
  componentWillMount() {
    setTimeout(() => {
      this.setState({hidden: false})
    }, 800);
  }
  render() {
    if (this.state.hidden) {
      return <div />
    }
    return (
        <div className='loading'>
          <div className="ball-grid-pulse">
            <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
          </div>
        </div>
    );
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
  componentWillUnmount() {
    clearInterval(this.interval);
  }
  startTimer() {
    if (FREEZE_GAME) {
      return;
    }
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
        strokeColor={'#1E8BC3'}
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
        <span className='errorMessage'>That's Jackie Chan!</span>
      )
    }
    // out of time
    else if (this.props.method === 1) {
      errorMessage = (
          <span className='errorMessage'>The time is up</span>
      )
    }
    return (
      <div className="gameOverScreenContainer">
        <div className="gameOverScreen">
          {
            this.props.url &&
            (
              <div 
                onClick={this.props.onClick}
                style={{backgroundImage: `url(${this.props.url})`}}
                className="piece wrongPiece"
                alt="Why can't you get one right?!"
              />
            )
          }
          <div className="errorMessage">
            {errorMessage}
          </div>
          <div onClick={this.props.reset} className="resetButton">
            Play again
          </div>
      </div>
      </div>
    )
  }
}

class GameWonScreen extends Component {
  render() {
    return (
      <div className="gameOverScreenContainer">
        <div className="gameOverScreen">
          <div className="errorMessage">
            Congratulations. You didn't find Jackie!
          </div>
          <img
            src={jackieStart}
            height={300}
          />
        </div>
      </div>
    );
  }
}

class LevelScore extends Component {
  constructor(props) {
    super(props);
    this.state = {
      animate: false
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.level === 0) {
      return;
    }
    if (this.props.level !== nextProps.level) {
      this.setState({
        animate: true,
      }, () => setTimeout(() => 
        this.setState({
          animate: false,
        }), 400))
    }
  }
  render() {
    const className = this.state.animate ? 'currentScore pulse': 'currentScore';
    return (
      <div className={className}>
        {this.props.best ? 'Best' : 'Level'}: {this.props.level + 1}
      </div>
    );
  }
}

export default App;
