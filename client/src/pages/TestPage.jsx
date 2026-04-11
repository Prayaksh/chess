import { useSocket } from "../hooks/useSocket.jsx";
import { useState } from "react";

const TestPage = () => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    try {
      const parsed = JSON.parse(input);
      emitEvent("message", parsed);
    } catch (err) {
      alert("Invalid JSON");
    }
  };
  const { serverMessage, emitEvent } = useSocket();

  return (
    <div>
      <p>{JSON.stringify(serverMessage, null, 2)}</p>
      <button
        onClick={() => {
          emitEvent("message", { type: "init_game", payload: {} });
        }}
      >
        Init Game
      </button>

      <div style={{ marginTop: "20px" }}>
        <textarea
          rows={6}
          cols={50}
          placeholder='Enter JSON like: {"type":"move","payload":{}}'
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <br />

        <button onClick={handleSend}>Send JSON</button>
      </div>
    </div>
  );
};

export default TestPage;
