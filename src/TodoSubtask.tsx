import { useLoaderData } from "react-router-dom";
import { useContext } from "react";
import { TodoistContext } from "./contexts/contexts";
import { TaskKanban } from "./common/TaskKanban";

export const TodoSubtask = () => {
  const { id } = useLoaderData() as { id: string };
  const api = useContext(TodoistContext);
  if (!api) {
    throw new Error("TodoistContext is null");
  }
  return <TaskKanban parentId={id} />;
};
