import { useContext } from "react";
import { TodoistContext } from "../contexts/contexts";
import { useTodoListByParentId, useTodoParentSet } from "../hooks/todoHook";
import { Link } from "react-router-dom";
import { useProjectIdToNameMap } from "../hooks/projectHook";

export const TaskList = ({ parentId }: { parentId?: string }) => {
  const api = useContext(TodoistContext);
  if (!api) {
    throw new Error("TodoistContext is null");
  }
  const { data: todoListSubtasks, isLoading } = useTodoListByParentId(
    api,
    parentId
  );

  const { data: todoParentSet } = useTodoParentSet(api);
  const { data: projectIdToNameMap, isLoading: isLoadingProject } =
    useProjectIdToNameMap(api);

  if (isLoading || isLoadingProject) {
    return <div>Loading...</div>;
  }

  return (
    <table className="table-auto">
      <thead>
        <tr>
          <th className="px-4 py-2">Content</th>
          <th className="px-4 py-2">Project ID</th>
        </tr>
      </thead>
      <tbody>
        {todoListSubtasks?.map((task) => (
          <tr key={task.id}>
            <td className="border px-4 py-2">
              {todoParentSet?.has(task.id) ? (
                <Link
                  to={`${task.id}`}
                  className="text-blue-500 hover:underline"
                >
                  {task.content}
                </Link>
              ) : (
                <>{task.content}</>
              )}
            </td>
            <td className="border px-4 py-2">
              {projectIdToNameMap?.[task.projectId]}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
