import "./App.css";
import SocketProvider from "./SocketProvider.jsx";
import ChessBoard from "./ChessBoard.jsx";
import Test from "./Test.jsx";

const App = () => {
  return (
    <SocketProvider>
      <ChessBoard></ChessBoard>
      {/* <Test></Test> */}
    </SocketProvider>
  );
};

export default App;
