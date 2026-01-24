import "./App.css";
import { AuthProvider } from "./Provider.jsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import TestPage from "./pages/TestPage.jsx";
import Auth from "./routes/Auth.jsx";
import Profile from "./routes/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";

function App() {
  return (
    //loading state skeleton
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
