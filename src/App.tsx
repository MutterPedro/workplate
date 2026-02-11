import { Routes, Route } from "react-router-dom";
import { Shell } from "./components/layout/Shell";
import { MyPlate } from "./views/MyPlate";
import { Backlog } from "./views/Backlog";
import { MyDay } from "./views/MyDay";
import { Settings } from "./views/Settings";

function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<MyPlate />} />
        <Route path="/backlog" element={<Backlog />} />
        <Route path="/my-day" element={<MyDay />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
