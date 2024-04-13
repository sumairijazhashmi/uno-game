import { Socket } from "socket.io-client" 
import { DefaultEventsMap } from "socket.io/dist/typed-events"
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DiscardPile from './DiscardPile';
import Messages from './Messages';
import Players from './Players';
import MyCards from './MyCards';
import Card from "./Card";

interface UnoProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>,
  name: string
}

interface GameState {
  discardPile: string[], 
  drawPile: string[],
  yourHand: string[],
  players: string[],
  currentTurn: string,
  yourName: string
}

const getYourHand = (players: any, name: string) => {
  for (let i=0; i<4; i++){
    if(players[i].name === name) {
      return players[i].hand
    }
  }
}

function Uno( {socket, name}: UnoProps) {

  const [gameState, setGameState] = useState<GameState>({
    discardPile: [], 
    drawPile: [],
    yourHand: ['x'],
    players: [],
    currentTurn: '',
    yourName: name
  });
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [disableColor, setDisableColor] = useState(false);
  const [playedCard, setPlayedCard] = useState('');
  const [justStarted, setJustStarted] = useState(true);
  const [error, setError] = useState('');
  const [winner, setWinner] = useState('');

  const passButton = () => {
    socket.emit('pass', name);  
  }

  const pickCardFromDeck = () => {
    const cardPlayed: string = gameState.drawPile[gameState.drawPile.length - 1];
    // keep the card in any case
    setGameState({
      ...gameState, 
      drawPile: gameState.drawPile.slice(0, gameState.drawPile.length - 1), 
      yourHand: [...gameState.yourHand, cardPlayed]
    });
    if(!['wild', 'draw-4'].includes(cardPlayed.split(' ')[0]) && cardPlayed.split(' ')[1] !== gameState.discardPile[gameState.discardPile.length - 1].split(' ')[1]) {
      setError('Cannot play this card.');
      // move to the next player's turn
      socket.emit('keepCardFromDeck', {name, cardPlayed, gameState});
    } 
    else {
      setPlayedCard(cardPlayed); 
      while(!gameState.yourHand.includes(cardPlayed)) {
        continue;
      }   
      socket.emit('playedCard', { name, card: playedCard, gameState });
    }
  }
  
  const handleGameState = (data: any) => {
    console.log('data', data);
    setGameState({
      drawPile: data.drawPile,
      discardPile: data.discardPile,
      yourHand: getYourHand(data.players, name),
      players: data.players.map((p: any) => {
        return p.name
      }),
      currentTurn: data.currentTurn,
      yourName: name
    });
    console.log('gameState', gameState);
    setLoaded(true);
  }
  
  const handleMessage = (data: any) => {
    setMessages(messages => [data, ...messages]); // swap data and messages if sorting doesn't work this way
  }

  useEffect(() => {

    const winnerHandler = (winner: any) => {
      setWinner(winner);
      setDisableColor(true);
    }

    const handleStartGameResolution = (data: any) => {
      console.log('here in game started resolution', data);
      if (data.actionCard) {
        // all cards can be selected
        setDisableColor(false);
      } else {
        // only cards with color === color of card in discard pile enabled
        console.log('disable non-matching colored cards')
        setDisableColor(true);
      }
    }

    socket.emit('sendGameState', name);
    socket.on('gameState', handleGameState);
    socket.on('message', handleMessage);
    socket.on('winner', winnerHandler);
    if(justStarted) {
      socket.emit('gamestarted');
      socket.on('gamestartedResolution', handleStartGameResolution); 
      setJustStarted(false);
    }
    return () => {
      socket.off('gameState', handleGameState)
      socket.off('gameState', handleStartGameResolution)
      socket.off('message', handleMessage);
      socket.off('winner', winnerHandler);
    }
  }, []);

  useEffect(() => {
    if (playedCard.length > 0) {
      socket.emit('playedCard', { name, card: playedCard, gameState });
      socket.emit('sendGameState', name);
      if(playedCard.split(' ')[0] === 'wild' || playedCard.split(' ')[0] === 'draw-4') {
        setDisableColor(false);
      }
      else {
        setDisableColor(true);
      }
      setError('');
    }
    setPlayedCard('');
  }, [playedCard]);
  

  // useEffect(() => {
  //   socket.on('message', handleMessage);
  //   return () => {
  //     socket.off('message', handleMessage);
  //   }
  // }, [handleMessage, socket]);

  useEffect(() => {
    setMessages(
      messages.sort((a, b) => {
        return b.localeCompare(a);
      })
    )
  }, [messages]);
  
  // useEffect(() => {
  //   if(gameState.discardPile.length > 0 && ['wild', 'draw-4'].includes(gameState.discardPile[gameState.discardPile.length - 1].split(' ')[0])) {
  //     setDisableColor(true);
  //   }
  //   else {
  //     setDisableColor(false);
  //   }
  // }, [gameState.discardPile])

  useEffect(() => { 
    if(gameState.yourHand.length === 0) {
      socket.emit('winner', name);
    }
  }, [gameState.yourHand]);

  return (
    <div className="main-container">
    {loaded ? 
      (
        <>
          <div className="game-container">
            <div className="heading-container">
              <h1>UNO</h1>
            </div>
            <div className="game-table-container">
              <div className="game-table">
                <div className="card-area">
                  {/* draw pile */}
                  <Card disable={false} card="U black"/>
                  {/* discard pile */}
                  <DiscardPile discardPile={gameState.discardPile}/>
                </div>

                <Players players={gameState.players} name={name} />
                
              </div>
            </div>
            <div className="select-rang-container">
              <button disabled={gameState.currentTurn === name ? false : true} className="button-select-rang" onClick={pickCardFromDeck}>Pick from deck</button>
              <button disabled={gameState.currentTurn === name ? false : true} className="button-select-rang" onClick={passButton} >Pass</button>
            </div>
          </div>
          <div className="messages-and-cards-container">
            <Messages messages={messages}/>
            <MyCards currentTurn={gameState.currentTurn} myName={gameState.yourName} setPlayedCard={setPlayedCard} disableColor={disableColor} cards={gameState.yourHand} setMessages={setMessages} discardPileTop={gameState.discardPile[gameState.discardPile.length - 1]} />
            <h1>{name}</h1>
            {error.length > 0 ? <h3>{error}</h3> : null}
            {winner.length > 0 ? <h3>{`${winner} has won the game!`}</h3> : null}
          </div>
        </>
    ) : <p>Loading</p>}
    </div>
  );
}

export default Uno;