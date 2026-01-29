import React from "react";

const Communicator = () => {
  return (
    <div>
      <div className="chat-container">
        <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "#333" }}>
          Server Monitor
        </h3>
        <div className="response-area">
          {gameState
            ? JSON.stringify(gameState, null, 2) // Fixed: null, 2 for proper spacing
            : "// Waiting for data..."}
        </div>
        <div className="input-group">
          <input
            className="input-field"
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Type a message..."
          />
          <button
            className="send-btn"
            onClick={() => {
              console.log("button clicked");

              emitEvent("message", JSON.parse(val));
            }} // Fixed: Wrapped in arrow function
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Communicator;
