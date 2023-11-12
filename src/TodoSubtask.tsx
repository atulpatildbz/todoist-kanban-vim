import { useLoaderData } from "react-router-dom";
import {
  useTodoList,
  useTodoListByParentId,
  useTodoParentSet,
} from "./hooks/todoHook";
import { useContext } from "react";
import { TodoistContext } from "./contexts/contexts";

interface Params {
  id: string;
}
export async function loader({ params }: { params: Params }) {
  return { id: params.id };
}
export const TodoSubtask = () => {
  const { id } = useLoaderData() as { id: string };
  const api = useContext(TodoistContext);
  if (!api) {
    throw new Error("TodoistContext is null");
  }
  const { data: todoListSubtasks, isLoading } = useTodoListByParentId(api, id);
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div>{JSON.stringify(todoListSubtasks)}</div>;
};
