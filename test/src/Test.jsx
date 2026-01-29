import { useState } from "react";
import { useSocket } from "./SocketProvider.jsx";

const Test = () => {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log("Before setState:", count); // e.g., 0
    setCount(count + 1);
    console.log("After setState:", count); // Still 0! (not updated yet)

    // This will NOT see the new count
    if (count === 1) {
      console.log("This won't run yet!");
    }
  };

  console.log("Render with count:", count); // Runs on every render

  return <button onClick={handleClick}>Count: {count}</button>;
};

export default Test;
