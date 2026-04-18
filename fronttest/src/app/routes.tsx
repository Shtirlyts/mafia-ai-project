import { createBrowserRouter } from "react-router";
import { GameContainer } from "./screens/GameContainer";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: GameContainer,
  },
]);
