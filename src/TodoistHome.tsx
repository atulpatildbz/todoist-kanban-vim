import { useContext } from "react";
import { TodoistContext } from "./contexts/contexts";

export const TodoistHome = () => {
  const api = useContext(TodoistContext);
  if (!api) return null;

  api
    .getProjects()
    .then((projects) => console.log(projects))
    .catch((error) => console.log(error));
  return "Hey";
};
