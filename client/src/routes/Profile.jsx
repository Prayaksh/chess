import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log("Profile useAuth fetched user is - ", user);

  return (
    <div>
      <h1>successfully logged in {user?.userId}</h1>
      <button
        onClick={() => {
          console.log("moving to home");
          navigate("/");
        }}
      >
        Move to home
      </button>
      <button
        onClick={() => {
          console.log("moving to game");
          navigate("/game");
        }}
      >
        Move to game
      </button>
    </div>
  );
};

export default Profile;
