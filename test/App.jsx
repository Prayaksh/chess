import "./App.css";
import Auth from "./routes/Auth.jsx";
import Profile from "./routes/Profile.jsx";
import Home from "./routes/Home.jsx";
import Test from "./routes/Test.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Provider.jsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/test" element={<Test />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
