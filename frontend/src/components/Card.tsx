import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface CardProps {
    disable: boolean,
    card: string,
    setPlayedCard?: (card: string) => void,
    currentTurn?: string,
    myName?: string,
}

const isNumberCard = (card: string) => {
    if(card.split(' ')[0].startsWith('num-')) {
        return true;
    }
    return false;
}

const getNumber = (card: string) => {
    return parseInt(card.split(' ')[0].split('-')[1])
}


function Card( {disable, card, setPlayedCard, currentTurn, myName}: CardProps ) {
    const className = `card ${card}`
    return (
        <div onClick={() => (setPlayedCard && !disable) ? setPlayedCard(card) : null } className={(disable || currentTurn !== myName ) ? className + ' disabled' : className}>
            <span className="inner">
                <span className="mark">
                    {
                        card.split(' ')[0] === 'U' ? 'U' : (isNumberCard(card) ? getNumber(card) : null)
                    }
                </span>
            </span>                            
        </div>
    );

}

export default Card;

