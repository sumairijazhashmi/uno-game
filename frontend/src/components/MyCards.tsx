import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "./Card";

interface MyCardsProps {
    cards: string[],
    setMessages: (mssgs : string[]) => void,
    disableColor: boolean,
    discardPileTop: string,
    setPlayedCard: (card: string) => void,
    currentTurn: string,
    myName: string,
}

function MyCards( {cards, setMessages, disableColor, discardPileTop, setPlayedCard, currentTurn, myName}: MyCardsProps ) {
    return (
        <div className="right-side-container my-cards-container">
            <h1>My Cards</h1>
            <div className="my-cards-inner-container">
                {
                    cards.map((card) => {
                        return (
                            <Card currentTurn={currentTurn} myName={myName} setPlayedCard={setPlayedCard} disable={disableColor && (discardPileTop.split(' ')[1] !== card.split(' ')[1] && card.split(' ')[0] !== 'wild' && card.split(' ')[0] !== 'draw-4')} card={card}/>
                        );
                    })
                }
            </div>
        </div>
    );
}

export default MyCards;