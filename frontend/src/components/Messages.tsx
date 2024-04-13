import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface MessagesProps {
    messages: string[]
}



function Messages( {messages} : MessagesProps ) {

    return (
        <div className="right-side-container messages-container">
            <h1>Messages</h1>
            <div className="message-box">
                {
                    messages.map((mssg) => {
                        return (
                            <div className="message-content-container"> 
                                {mssg}
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
}

export default Messages;