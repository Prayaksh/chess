import "./App.css";
import SocketProvider, { AuthProvider } from "./Provider.jsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import TestPage from "./pages/TestPage.jsx";
import Auth from "./routes/Auth.jsx";
import Profile from "./routes/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";
import Game from "./routes/Game.jsx";
import ProtectedRoutes from "./routes/ProtectedRoutes.jsx";

function App() {
  return (
    //loading state skeleton
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Auth />} />

            <Route
              path="/test"
              element={
                <ProtectedRoutes>
                  <TestPage />
                </ProtectedRoutes>
              }
            />
            <Route path="/profile" element={<Profile />} />
            <Route path="/game" element={<Game />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
