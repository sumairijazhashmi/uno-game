import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "./Card";

interface DiscardPileProps {
    discardPile: string[]
}

function DiscardPile( {discardPile} : DiscardPileProps ) {
    useEffect(() => {
        console.log(discardPile);
    }, []);

    return (
        <div className="card discard-pile black">
            <span className="inner">
                {/* only show the latest card in the discard pile */}
                <Card disable={false} card={discardPile[discardPile.length - 1]} />
            </span>
        </div>
    );
}

export default DiscardPile;