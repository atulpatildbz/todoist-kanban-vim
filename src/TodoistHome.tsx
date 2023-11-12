import { useContext } from "react";
import { TodoistContext } from "./contexts/contexts";
import { useProjectList } from "./hooks/projectHook";
import { useTodoList } from "./hooks/todoHook";
import { Spinner } from "./common/Spinner";

export const TodoistHome = () => {
  const api = useContext(TodoistContext);
  if (!api) {
    throw new Error("TodoistContext is null");
  }
  //   const {
  //     data: projectList,
  //     isLoading: isProjectListLoading,
  //     isError: isProjectListError,
  //   } = useProjectList(api);

  const {
    data: todoList,
    isLoading: isTodoListLoading,
    isError: isTodoListError,
  } = useTodoList(api);

  if (isTodoListError) {
    return <div>Error</div>;
  }

  if (isTodoListLoading || !todoList) {
    return <Spinner />;
  }

  console.info("todoList: ", todoList);
  return (
    <div className="p-4">
      {/* {projectList.map((project) => (
        <div key={project.id} className="p-2 bg-blue-100 rounded-lg mb-2">
          {project.name}
        </div>
      ))} */}

      {todoList &&
        todoList.map((todo) => (
          <div key={todo.id} className="p-2 bg-blue-100 rounded-lg mb-2">
            {todo.content}
          </div>
        ))}
    </div>
  );
};
