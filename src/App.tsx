import { Outlet } from "react-router-dom";
import "./App.css";
import { Navbar } from "./Navbar";
function App() {
  return (
    <div>
      <Navbar />
      <div>
        <Outlet />
      </div>
    </div>
  );
}

export default App;
