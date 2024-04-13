import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import "./Home.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

//create an interface for the props that you want to pass to this component
interface HomePageProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
  //you can always add more functions/objects that you would like as props for this component
  setName: (name: string) => void;
  name: string;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  numPlayers: number;
  setNumPlayers: (numPlayers: number) => void;
  setStartGame: (startGame: boolean) => void;
  ready: boolean;
}

function HomePage({
  socket,
  name,
  ready,
  setName,
  loading,
  setLoading,
  numPlayers,
  setNumPlayers,
  setStartGame,
}: HomePageProps) {

  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [disable, setDisabled] = useState(false);

  //click handler
  const handleClick = (socket: Socket) => {
    console.log("Socket ID:", socket.id);
    // Do something with the socket object, such as emit an event
    setLoading(true);
    socket.emit("name", name, () => {
      console.log("Name delivered!");
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  useEffect(() => {
    socket.on("numPlayers", (numPlayers: number) => {
      setNumPlayers(numPlayers);
    });

    socket.on('new_player', (data) => {
      console.log(`new player ${data} joined`)
    })
  }, []);

  socket.on('error', (error) => {
    setErrorMessage(error.message);
  })

  socket.on("start_game", () => {
    setLoading(false);
    setStartGame(true);
    setTimeout(() => {
      navigate("/uno");
    }, 3000);
  });


  return (
    <>
      {errorMessage === '' ? (<div className="sampleHomePage">
          <h1 className="sampleTitle">Uno</h1>
          <div className="sampleMessage">
            <p>Please reload the page thrice before you do anything ^_^</p>
            <p>Enter your name to start the game:</p>
            <input onChange={handleNameChange} placeholder="Name"></input>
            <button disabled={disable} onClick={() => {
                handleClick(socket)
                setDisabled(true)
              }
            }>Enter</button>
            {loading && (
              <p>
                Waiting for other players to join! Currently, {numPlayers} have
                joined, {4 - numPlayers} left.
              </p>
            )}
            {ready && <p>All players have joined! Starting the game...</p>}
          </div>
        </div>) : <h1>Error! Max people have signed up!</h1>
      }
    </>
  );
}
export default HomePage;
