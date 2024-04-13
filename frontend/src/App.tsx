import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import HomePage from './components/Home/Home';
import Uno from './components/Uno';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';
import {io} from "socket.io-client"
const socket = io('http://localhost:3001',{ transports: ["websocket"] });
socket.connect()

function App() {
  
  // const [currsocket, setSocket] = useState();
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [numPlayers, setNumPlayers] = useState(0);
  const [startGame, setStartGame] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      const storedClientId = sessionStorage.getItem('clientId');
      if(storedClientId) {
        console.log("here...")
        setClientId(storedClientId);
        socket.emit('oldClientId', storedClientId);
      }
      else {
        socket.on('clientId', (clientId: string) => {
          sessionStorage.setItem('clientId', clientId);
          setClientId(clientId);
        });
      }
    })
  }, []);


  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage ready={startGame} setStartGame={setStartGame} numPlayers={numPlayers} setNumPlayers={setNumPlayers} loading={loading} setLoading={setLoading} setName={setName} name={name} socket={socket} />} />
          <Route path="/uno" element={<Uno name={name} socket={socket}/>} />
        </Routes>
      </Router>

    </div>
  );
}

export default App;
