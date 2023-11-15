import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TodoistContext } from "../contexts/contexts";
import {
  useCloseTask,
  useCreateTodo,
  useDeleteTodo,
  useTodoListByParentId,
  useTodoParentSet,
  useUpdateTodo,
} from "../hooks/todoHook";
import { Link } from "react-router-dom";
import { useProjectIdToNameMap } from "../hooks/projectHook";
import { Box, Card, Flex, Text } from "@radix-ui/themes";

const KANBAN_TODO = "KANBAN_TODO";
const KANBAN_BLOCKED = "KANBAN_BLOCKED";
const KANBAN_IN_PROGRESS = "KANBAN_IN_PROGRESS";
const KANBAN_DONE = "KANBAN_DONE";

const NO_LABEL = 0;
const TODO = 1;
const BLOCKED = 2;
const IN_PROGRESS = 3;
const DONE = 4;

const INDEX_TO_LABEL_MAP = [
  "",
  KANBAN_TODO,
  KANBAN_BLOCKED,
  KANBAN_IN_PROGRESS,
  KANBAN_DONE,
];

type Direction = "left" | "right";
const columnNames = ["Not Set", "Todo", "Blocked", "In Progress", "Done"];

export const TaskKanban = ({ parentId }: { parentId?: string }) => {
  const taskRefs = useRef(new Map()).current;
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string | null>(null);
  const [searchResultIndex, setSearchResultIndex] = useState<number | null>(
    null
  );
  const api = useContext(TodoistContext);
  if (!api) {
    throw new Error("TodoistContext is null");
  }
  const { data: todoListSubtasks, isLoading } = useTodoListByParentId(
    api,
    parentId
  );
  const updateTodo = useUpdateTodo(api);
  const createTodo = useCreateTodo(api);
  const closeTodo = useCloseTask(api);
  const deleteTodo = useDeleteTodo(api);

  const { data: todoParentSet } = useTodoParentSet(api);
  const { data: projectIdToNameMap, isLoading: isLoadingProject } =
    useProjectIdToNameMap(api);

  const columns = useMemo(() => {
    const cols: string[][] = [[], [], [], [], []];

    todoListSubtasks?.forEach((task) => {
      const columnIndex = task.labels.includes(KANBAN_TODO)
        ? TODO
        : task.labels.includes(KANBAN_BLOCKED)
        ? BLOCKED
        : task.labels.includes(KANBAN_IN_PROGRESS)
        ? IN_PROGRESS
        : task.labels.includes(KANBAN_DONE)
        ? DONE
        : NO_LABEL;
      cols[columnIndex].push(task.id);
    });

    return cols;
  }, [todoListSubtasks]);

  const eligibleTasks = useMemo(() => {
    if (!searchText || !todoListSubtasks) return [];
    return todoListSubtasks
      ?.filter((task) => task.content.includes(searchText))
      .sort((a, b) => {
        const labelOrder = [
          "",
          KANBAN_TODO,
          KANBAN_BLOCKED,
          KANBAN_IN_PROGRESS,
          KANBAN_DONE,
        ];
        const aLabel = a.labels[0] || "";
        const bLabel = b.labels[0] || "";
        return labelOrder.indexOf(aLabel) - labelOrder.indexOf(bLabel);
      });
  }, [todoListSubtasks, searchText]);

  if (eligibleTasks.length && searchResultIndex !== null) {
    if (selectedTaskId !== eligibleTasks[searchResultIndex].id) {
      setSelectedTaskId(eligibleTasks[searchResultIndex].id);
    }
  }

  const setNewKanbanIndex = useCallback(
    (newLabelIndex: number) => {
      if (selectedTaskId === null) return;
      const newLabel = INDEX_TO_LABEL_MAP[newLabelIndex];
      updateTodo.mutate({
        id: selectedTaskId,
        data: { labels: newLabel === "" ? [] : [newLabel] },
      });
    },
    [selectedTaskId, updateTodo]
  );

  const moveCard = useCallback(
    (direction: Direction) => {
      if (!selectedTaskId) return;
      const columnIndex = columns.findIndex((column) =>
        column.includes(selectedTaskId)
      );
      if (columnIndex === -1) return;

      const isLeft = direction === "left";
      const isRight = direction === "right";
      const canMoveLeft = isLeft && columnIndex > 0;
      const canMoveRight =
        isRight && columnIndex < INDEX_TO_LABEL_MAP.length - 1;

      const newLabelIndex = canMoveLeft
        ? columnIndex - 1
        : canMoveRight
        ? columnIndex + 1
        : columnIndex;

      setNewKanbanIndex(newLabelIndex);
    },
    [selectedTaskId, columns, setNewKanbanIndex]
  );

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "h" || event.key === "ArrowLeft") {
        moveCard("left");
      } else if (event.key === "l" || event.key === "ArrowRight") {
        moveCard("right");
      } else if (event.key === "/") {
        setSearchText(prompt("Enter text:"));
        setSearchResultIndex(0);
      } else if (event.key === "Escape") {
        setSearchText(null);
        setSelectedTaskId(null);
      } else if (event.key === "o") {
        const newTaskContent = prompt("Enter content for new task:");
        if (newTaskContent) {
          createTodo.mutate({ content: newTaskContent, parentId });
        }
      } else if (event.key === "x" && selectedTaskId) {
        deleteTodo.mutate(selectedTaskId);
        setSelectedTaskId(null);
      } else if (event.key === "c" && selectedTaskId) {
        closeTodo.mutate(selectedTaskId);
        setSelectedTaskId(null);
      } else if (searchResultIndex !== null) {
        if (event.key === "n") {
          setSearchResultIndex((searchResultIndex + 1) % eligibleTasks.length);
        } else if (event.key === "N") {
          setSearchResultIndex(
            (searchResultIndex - 1 + eligibleTasks.length) %
              eligibleTasks.length
          );
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [
    selectedTaskId,
    moveCard,
    searchResultIndex,
    setSearchText,
    setSearchResultIndex,
    eligibleTasks,
    parentId,
    createTodo,
    deleteTodo,
    closeTodo,
  ]);

  useEffect(() => {
    if (searchText && searchResultIndex !== null) {
      const selectedTaskRef = taskRefs.get(selectedTaskId);
      selectedTaskRef?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTaskId, taskRefs, searchText, searchResultIndex]);

  if (isLoading || isLoadingProject) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <table className="table-auto w-full border-2 border-gray-200 bg-gray-300">
        <thead>
          <tr>
            {columnNames.map((name, index) => (
              <th
                key={index}
                className="px-4 py-2 text-center w-1/5 border-b-2 border-gray-200"
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>
      </table>
      <div className="grid grid-cols-5 gap-4">
        {columns.map((column, index) => (
          <div key={index}>
            {column.map((taskId) => {
              const task = todoListSubtasks?.find((t) => t.id === taskId);
              return task ? (
                <Card
                  ref={(el) => taskRefs.set(task.id, el)}
                  className="max-w-sm "
                  style={{
                    backgroundColor: selectedTaskId === task.id ? "yellow" : "",
                  }}
                  key={task.id}
                  variant="classic"
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setSearchResultIndex(null);
                  }}
                >
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
                        <a
                          href={task.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "inline-block", marginLeft: "5px" }}
                        >
                          <img
                            src="/open-icon.svg"
                            alt="Open"
                            style={{ width: "10px", height: "10px" }}
                          />
                        </a>
                      </Text>
                      <Text as="div" size="2" color="gray">
                        {projectIdToNameMap?.[task.projectId]}
                      </Text>
                      {task.due && (
                        <Text as="div" size="2" color="gray">
                          {task.due.string}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                </Card>
              ) : null;
            })}
          </div>
        ))}
      </div>
    </>
  );
};
