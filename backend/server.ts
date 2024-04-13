import { Socket } from "socket.io";

const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

server.listen(3001, () => {
  console.log("SERVER IS LISTENING ON PORT 3001");
});

// make card decks
const makeNumbersCardsFromColors = (color: string): string[] => {
  const nums: string[] = [];
  for (let j = 0; j < 10; j++) {
    if (j == 0) {
      nums.push(`num-${j.toString()} ${color}`);
    } else {
      nums.push(`num-${j.toString()} ${color}`);
      nums.push(`num-${j.toString()} ${color}`);
    }
  }
  return nums;
};

const shuffleDeck = (deck: string[]): string[] => {
  return deck.sort(() => Math.random() - Math.random());
};

const createCardDeck = () => {
  const deck: string[] = [];
  const colors: string[] = ["red", "green", "blue", "yellow"];
  const special: string[] = ["skip", "reverse", "draw", "draw-4", "wild"];

  // make number cards, 19 for each color - 2 for each from 1-9 and 1 for 0
  // make 2 skip cards for each color
  // make 2 reverse cards for each color
  // make 2 draw cards for each color
  for (const color of colors) {
    const current_color_numbers: string[] = makeNumbersCardsFromColors(color);
    deck.push(...current_color_numbers);
    const current_color_skip: string[] = [
        `${special[0]} ${color}`,
        `${special[0]} ${color}`,
    ];
    deck.push(...current_color_skip);
    const current_color_reverse: string[] = [
        `${special[1]} ${color}`,
        `${special[1]} ${color}`,
    ];
    deck.push(...current_color_reverse);
    const current_color_draw: string[] = [
        `${special[2]} ${color}`,
        `${special[2]} ${color}`,   
    ];
    deck.push(...current_color_draw);
  }

  // make 4 wild and 4 wild-draw cards
  for (let i = 0; i < 4; i++) {
    deck.push(`${special[3]} ${colors[i]}`);
    deck.push(`${special[4]} ${colors[i]}`);
  }

  // shuffle the card deck
  const shuffledDeck: string[] = shuffleDeck(deck);
  return shuffledDeck;
};

// make deck
const deck: string[] = createCardDeck();
let discardPile = [deck.pop()]
let drawPile: string[] = deck;

// a single interface for a player, storing their id, name, socketId, and cards
interface Player {
    name: string;
    socketId: string;
    hand: string[];
}

// make players, handle socket connection stuff
interface Client {
    socketId: string;
};

let clients: { [clientId: string]: Client } = {};

// each subarray is the hand of each player
const globalGameState = {
  discardPile: [],
  drawPile: [],
  players: [],
  currentTurn: null,
  currentPlayerIndex: null
}

let currentClientId = 0;
let players: Player[] = [];
let numPlayers = 0;
let persistentClientId: string = "";

let currentTurn = '';

io.on("connection", (socket: Socket) => {
    
    // get client id from client
    socket.on('oldClientId', (clientId: string) => {
        persistentClientId = clientId;
    })

    // if server gets no clientid from client, then make a new client and save it
    if(persistentClientId === "") {
        currentClientId += 1;
        persistentClientId = currentClientId.toString();
        clients[persistentClientId] = {
            socketId: socket.id
        };
        socket.emit('clientId', persistentClientId);
        console.log(`new client ${persistentClientId} with socket id ${socket.id} added.`)
    }
    // else reassign a new socket.id to this existing client
    else {
        console.log(persistentClientId);
        const client = clients[persistentClientId];
        if (client) {
            client.socketId = socket.id;
            console.log(`client ${persistentClientId} just reloaded the page. new socket id ${socket.id} assigned.`);
        } 
        currentClientId = parseInt(persistentClientId);
    }

    // get name from client
    socket.on('name', (name) => {
        if(numPlayers >= 4) {
            io.emit('error', {message: 'Cannot add more players!'});
        }
        console.log(`${name} just joined the server`)
        let currentPlayer: Player = {
            name: name,
            socketId: persistentClientId,
            hand: []
        }

        players.push(currentPlayer);

        // tell everyone who has joined the game
        io.emit('new_player', currentPlayer.name);

        // increment the number of players
        numPlayers += 1;
        io.emit('numPlayers', numPlayers);

        // if there are 4 players, start the game
        if(numPlayers === 4) {
            io.emit('start_game');

            // distribute the cards to the players and send them all the game state
            for(let i=0; i<players.length; i++) {
              if(i === 0) {
                currentTurn = players[i].name;
              }
              for(let j=0; j<7; j++) {
                  const card = deck.pop();

                  if(card) {
                      players[i].hand.push(card);
                      drawPile = drawPile.filter(value => value !== card);
                  }
              }
              console.log(players[i].hand.length);
            }

        }
    });
        
    // get the player with player.name === name, send them the game state (discard Pile, their hand, all the players' names and the other relevant stuff)
    socket.on('sendGameState', (name) => {
        // find the player with the specified name
        console.log('name', name);
        console.log('here')
        const player = players.find(p => p.name === name);
        if (!player) {
            socket.emit('error', { message: `Player ${name} not found.` });
            return;
        }
        // send the game state to the player
        const gameState = {
            discardPile, 
            drawPile,
            players: players.map((player: Player) => ({
              name: player.name,
              hand: player.hand 
            })),
            currentTurn,
        };

        console.log(gameState);

        socket.emit('gameState', gameState);
      });
      
      // game started, check if discard pile top is action card, if yes player 1 can move anything
      socket.on('gamestarted', () => {
        socket.emit('message', 'Game Started, Good Luck!');
        socket.emit('message', `${currentTurn}'s turn`);
        console.log('here in gamestarted')
        // console.log('players:', players)
        if(discardPile[discardPile.length - 1]?.startsWith('draw-4') || discardPile[discardPile.length - 1]?.startsWith('wild')) {
          console.log('here in is action card')
          socket.emit('gamestartedResolution', {
            actionCard: true
          })
          socket.emit('message', `Discard Pile has action card. ${players[0].name} can play any card!`);
        }
        else {
        console.log('here in is not action card')
        socket.emit('gamestartedResolution', {
          actionCard: false
        })
        socket.emit('message', `Discard Pile doesn't have action card. ${players[0].name} can only play the cards of the same color as the one on the Discard Pile!`);
      }
    })

    // on card played by player
    socket.on('playedCard', (data) => {
      const {name, card, gameState} = data;
      // find the player who played the card
      console.log('players', players);
      const playerIndex = players.findIndex((player: Player) => player.name === name);

      // remove the played card from the player's hand and add it to the discard pile
      const playedCardIndex = players[playerIndex].hand.findIndex(playerCard => playerCard === card);
      console.log('game state');
      console.log(gameState)
      players[playerIndex].hand.splice(playedCardIndex, 1);
      discardPile.push(card);

      // handle functionality if action card
      const card_type = card.split(' ')[0];

      if(card_type == 'skip') {
        // skip the turn of the next player
        currentTurn = players[(playerIndex + 2) % gameState.players.length].name;        
      }
      else if(card_type == 'reverse') {
        // reverse the turn of the players
        players.reverse();
        currentTurn = players[playerIndex % gameState.players.length].name;        
      }
      else if(card_type == 'draw') {
        // next player has to draw 2 new cards from the deck
        const nextPlayerIndex = (playerIndex + 1) % gameState.players.length
        players[nextPlayerIndex].hand.push(drawPile[drawPile.length - 1])
        drawPile.pop()
        players[nextPlayerIndex].hand.push(drawPile[drawPile.length - 1])
        drawPile.pop()
        currentTurn = players[(playerIndex + 1) % gameState.players.length].name;
      }
      else if(card_type == 'draw-4') {
        // turn continues for the current player and can throw can of any color
        // next player has to draw 4 cards and has to skip their turn
        currentTurn = currentTurn
        const nextPlayerIndex = (playerIndex + 1) % gameState.players.length
        players[nextPlayerIndex].hand.push(drawPile[drawPile.length - 1])
        drawPile.pop()
        players[nextPlayerIndex].hand.push(drawPile[drawPile.length - 1])
        drawPile.pop()
        players[nextPlayerIndex].hand.push(drawPile[drawPile.length - 1])
        drawPile.pop()
        players[nextPlayerIndex].hand.push(drawPile[drawPile.length - 1])
        drawPile.pop()
      }
      else if(card_type == 'wild') {
        // turn continues for the current player and can throw can of any color
        currentTurn = currentTurn;
      }
      else {
        // set the next player's turn
        currentTurn = players[(playerIndex + 1) % gameState.players.length].name;
      }


      const updatedGameState = {
        discardPile, 
        drawPile,
        players: players.map((player: Player) => ({
          name: player.name,
          hand: player.hand 
        })),
        currentTurn
      };
      
      // tell everyone what move was made and send them the updated state
      io.emit('gameState', updatedGameState);
      io.emit('message', `${name} played ${card}`);
      io.emit('message', `${currentTurn}'s turn`);
      
    })

    // player pressed pass button
    socket.on('pass', (data) => {
      // change player turn to next player
      const playerIndex = players.findIndex((player: Player) => player.name === data);
      currentTurn = players[(playerIndex + 1) % players.length].name;
      const updatedGameState = {
        discardPile, 
        drawPile,
        players: players.map((player: Player) => ({
          name: player.name,
          hand: player.hand 
        })),
        currentTurn
      };
      
      // tell everyone what move was made and send them the updated state
      io.emit('gameState', updatedGameState);
      io.emit('message', `${data} skipped their turn`);
      io.emit('message', `${currentTurn}'s turn`);
    })

    // next turn - when card picked from deck and can't be played
    // put the card in the player's hand and change the turn
    socket.on('keepCardFromDeck', (data) => {
      const {name, cardPlayed, gameState} = data;
      
      const playerIndex = players.findIndex((player: Player) => player.name === name);
      currentTurn = players[(playerIndex + 1) % players.length].name;

      players[playerIndex].hand.push(cardPlayed);
      const indexFromDraw = drawPile.indexOf(cardPlayed);
      drawPile.splice(indexFromDraw, 1);

      const updatedGameState = {
        discardPile, 
        drawPile,
        players: players.map((player: Player) => ({
          name: player.name,
          hand: player.hand 
        })),
        currentTurn
      };
      
      // tell everyone what move was made and send them the updated state
      io.emit('gameState', updatedGameState);
      io.emit('message', `${name} picked card from deck`);
      io.emit('message', `${currentTurn}'s turn`);
    
    }); 


    socket.on('winner', (name) => {
      io.emit('winner', name);
      io.emit('message', `${name} has won the game!`);
    })
    
    persistentClientId = "";
    
    socket.on('disconnect', () => {
        console.log("disconnected!");
    })
});
