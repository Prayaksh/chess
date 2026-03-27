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
            <Route path="/login" element={<Auth />} />

            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/test" element={<TestPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/game" element={<Game />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
