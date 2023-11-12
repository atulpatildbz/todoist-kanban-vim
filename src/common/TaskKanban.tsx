import { useContext } from "react";
import { TodoistContext } from "../contexts/contexts";
import { useTodoListByParentId, useTodoParentSet } from "../hooks/todoHook";
import { Link } from "react-router-dom";
import { useProjectIdToNameMap } from "../hooks/projectHook";
import { Box, Card, Flex, Text } from "@radix-ui/themes";
// import { Card } from "./Card";

export const TaskKanban = ({ parentId }: { parentId?: string }) => {
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

  const columns: JSX.Element[][] = [[], [], [], [], []];

  todoListSubtasks?.forEach((task) => {
    let columnIndex = 0;
    if (task.labels.includes("KANBAN_TODO")) columnIndex = 1;
    else if (task.labels.includes("KANBAN_BLOCKED")) columnIndex = 2;
    else if (task.labels.includes("KANBAN_IN_PROGRESS")) columnIndex = 3;
    else if (task.labels.includes("KANBAN_DONE")) columnIndex = 4;

    columns[columnIndex].push(
      <Card className="max-w-sm" key={task.id}>
        <Flex gap="3" align="center">
          <Box>
            <Text as="div" size="2" weight="bold">
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
            </Text>
            <Text as="div" size="2" color="gray">
              {projectIdToNameMap?.[task.projectId]}
            </Text>
          </Box>
        </Flex>
      </Card>
    );
  });

  return (
    <>
      <table className="table-auto w-full border-2 border-gray-200 bg-gray-300">
        <thead>
          <tr>
            <th className="px-4 py-2 text-center w-1/5 border-b-2 border-gray-200">
              Not Set
            </th>
            <th className="px-4 py-2 text-center w-1/5 border-b-2 border-gray-200">
              Todo
            </th>
            <th className="px-4 py-2 text-center w-1/5 border-b-2 border-gray-200">
              Blocked
            </th>
            <th className="px-4 py-2 text-center w-1/5 border-b-2 border-gray-200">
              In Progress
            </th>
            <th className="px-4 py-2 text-center w-1/5 border-b-2 border-gray-200">
              Done
            </th>
          </tr>
        </thead>
      </table>
      <div className="grid grid-cols-5 gap-4">
        {columns.map((column, index) => (
          <div key={index}>{column}</div>
        ))}
      </div>
    </>
  );
};
