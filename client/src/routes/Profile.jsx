import { useAuth } from "../hooks/useAuth.jsx";

const Profile = () => {
  const { user } = useAuth();
  return (
    <div>
      <h1>successfully logged in {user?.userId}</h1>
    </div>
  );
};

export default Profile;
