import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface PlayersProps {
    players: string[],
    name: string,
}

const convertNumberToText = (inx: number) => {
    if(inx === 0) {
        return 'one';
    }
    if(inx === 1) {
        return 'two';
    }
    if(inx === 2) {
        return 'three';
    }
    if(inx === 3) {
        return 'four';
    }
}

function Players( {players, name} : PlayersProps ) {
    return (
        <div>
        {
            players.map((player: string, index: number) => {
                const className = `player-tag player-${convertNumberToText(index)}`;
                return (
                    <div className="game-players-container">
                        <div className={className}>{player}</div>
                    </div>
                );
            })
        }
        </div>
    );
}

export default Players;