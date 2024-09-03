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
import { Link, useNavigate } from "react-router-dom";
import { useProjectIdToNameMap } from "../hooks/projectHook";
import {
  useIsFetching,
  useIsMutating,
  useQueryClient,
} from "@tanstack/react-query";
import { TODO_KEY } from "../constants/queryKeys";
import { Task } from "@doist/todoist-api-typescript";
import { Spinner } from "./Spinner";
import {
  BLOCKED,
  columnNames,
  DONE,
  IN_PROGRESS,
  INDEX_TO_LABEL_MAP,
  KANBAN_BLOCKED,
  KANBAN_DONE,
  KANBAN_IN_PROGRESS,
  KANBAN_TODO,
  NO_LABEL,
  TODO,
} from "../constants/constants";

type Direction = "left" | "right";

let previousKey: string | null = null;

const labelColors: Record<string, string> = {};

export const TaskKanban = ({ parentId }: { parentId?: string }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isFetchingCount = useIsFetching();
  const isMutatingCount = useIsMutating();

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

  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedDueDates, setSelectedDueDates] = useState<string[]>([
    "today_and_past",
  ]);

  const sortedTasks = useMemo(() => {
    return [...(todoListSubtasks || [])].sort((a, b) => {
      const aDate = a.due
        ? a.due.datetime
          ? new Date(a.due.datetime)
          : a.due.date
          ? new Date(a.due.date)
          : Infinity
        : Infinity;
      const bDate = b.due
        ? b.due.datetime
          ? new Date(b.due.datetime)
          : b.due.date
          ? new Date(b.due.date)
          : Infinity
        : Infinity;

      const aHasDateTime = a.due && a.due.datetime;
      const bHasDateTime = b.due && b.due.datetime;

      if (aHasDateTime && !bHasDateTime) {
        return -1;
      } else if (!aHasDateTime && bHasDateTime) {
        return 1;
      } else {
        return (
          (aDate instanceof Date ? aDate.getTime() : aDate) -
          (bDate instanceof Date ? bDate.getTime() : bDate)
        );
      }
    });
  }, [todoListSubtasks]);

  const filteredTasks = useMemo(() => {
    return sortedTasks?.filter((task) => {
      const projectFilter =
        selectedProjects.length === 0 ||
        selectedProjects.includes("allProjects") ||
        selectedProjects.includes(task.projectId);

      const dueDateFilter =
        selectedDueDates.length === 0 ||
        selectedDueDates.includes("allDueDates") ||
        selectedDueDates.some((filter) => {
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          const taskDueDate = task.due
            ? new Date(task.due.datetime || task.due.date)
            : null;

          if (filter === "today" && taskDueDate) {
            return taskDueDate.toDateString() === today.toDateString();
          } else if (filter === "today_and_past" && taskDueDate) {
            return taskDueDate <= today;
          } else if (filter === "all" && taskDueDate) {
            return true;
          }
          return false;
        });

      return projectFilter && dueDateFilter;
    });
  }, [sortedTasks, selectedProjects, selectedDueDates]);

  const columns = useMemo(() => {
    const cols: string[][] = [[], [], [], [], []];

    filteredTasks?.forEach((task) => {
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
  }, [filteredTasks]);

  const eligibleTasks = useMemo(() => {
    if (!searchText || !sortedTasks) return [];
    return sortedTasks
      ?.filter((task) => {
        if (searchText === searchText.toLowerCase()) {
          return task.content.toLowerCase().includes(searchText);
        }
        return task.content.includes(searchText);
      })
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
  }, [sortedTasks, searchText]);

  if (eligibleTasks.length && searchResultIndex !== null) {
    if (selectedTaskId !== eligibleTasks[searchResultIndex].id) {
      setSelectedTaskId(eligibleTasks[searchResultIndex].id);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const debouncedFunction = (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    };

    return debouncedFunction;
  };

  const debouncedMutate = useDebounce(
    (selectedTaskId: string, newLabels: string[]) => {
      updateTodo.mutate({
        id: selectedTaskId,
        data: { labels: newLabels },
      });
    },
    500
  );

  const setNewKanbanIndex = useCallback(
    (newLabelIndex: number) => {
      if (selectedTaskId === null) return;
      const newLabel = INDEX_TO_LABEL_MAP[newLabelIndex];

      const existingTask = sortedTasks?.find(
        (task) => task.id === selectedTaskId
      );
      let oldLabels = existingTask?.labels || [];

      oldLabels = oldLabels.filter(
        (label) => !INDEX_TO_LABEL_MAP.includes(label)
      );

      const newLabels = newLabel === "" ? oldLabels : [...oldLabels, newLabel];

      // Immediately set the query data
      queryClient.setQueryData([TODO_KEY], (todos: Task[]) => {
        return todos.map((todo) => {
          if (todo.id === selectedTaskId) {
            return { ...todo, labels: newLabels };
          }
          return todo;
        });
      });

      // Debounced mutate call
      debouncedMutate(selectedTaskId, newLabels);
    },
    [selectedTaskId, queryClient, debouncedMutate, sortedTasks]
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
        let newTaskContent = prompt("Enter content for new task:");
        if (newTaskContent) {
          let due_string: string | undefined = undefined;
          if (newTaskContent.includes("|")) {
            const parts = newTaskContent.split("|");
            newTaskContent = parts[0];
            due_string = parts[1];
          }
          const createData = { content: newTaskContent, parentId, due_string };
          createTodo.mutate(createData);
        }
      } else if (event.key === "x" && selectedTaskId) {
        deleteTodo.mutate(selectedTaskId);
        setSelectedTaskId(null);
      } else if (event.key === "c" && selectedTaskId) {
        closeTodo.mutate(selectedTaskId);
        setSelectedTaskId(null);
      } else if (event.key === "d" && previousKey === "g") {
        navigate(`/todos/${selectedTaskId}`);
      } else if (event.key === "H") {
        navigate(-1);
      } else if (event.key === "L") {
        navigate(1);
      } else if (event.key === "g" && previousKey === "g") {
        window.scrollTo(0, 0);
      } else if (event.key === "G") {
        window.scrollTo(0, document.body.scrollHeight);
      } else if (event.ctrlKey && event.key === "d") {
        window.scrollBy(0, window.innerHeight);
      } else if (event.ctrlKey && event.key === "u") {
        window.scrollBy(0, -window.innerHeight);
      } else if (event.key === "j") {
        window.scrollBy(0, window.innerHeight / 2.5);
      } else if (event.key === "k") {
        window.scrollBy(0, -window.innerHeight / 2.5);
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
      previousKey = event.key;
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
    navigate,
  ]);

  useEffect(() => {
    if (searchText && searchResultIndex !== null) {
      const selectedTaskRef = taskRefs.get(selectedTaskId);
      selectedTaskRef?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTaskId, taskRefs, searchText, searchResultIndex]);

  if (isLoading || isLoadingProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex space-x-4 items-center justify-between">
        <div className="flex space-x-4">
          <select
            className="bg-gray-800 text-white p-2 rounded w-48 text-sm"
            value={selectedProjects}
            onChange={(e) =>
              setSelectedProjects(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            multiple={false}
          >
            <option value="allProjects">All Projects</option>
            {Object.entries(projectIdToNameMap || {}).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <select
            className="bg-gray-800 text-white p-2 rounded w-48 text-sm"
            value={selectedDueDates}
            onChange={(e) =>
              setSelectedDueDates(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            multiple={false}
          >
            <option value="allDueDates">All Due Dates</option>
            <option value="today">Today</option>
            <option value="today_and_past">Today and Past</option>
          </select>
        </div>

        {(isFetchingCount > 0 || isMutatingCount > 0) && <Spinner />}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {columns.map((column, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-4 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-white border-b border-gray-700 pb-2">
              {columnNames[index]}
            </h2>
            {column.map((taskId) => {
              const task = todoListSubtasks?.find((t) => t.id === taskId);
              return task ? (
                <div
                  key={task.id}
                  ref={(el) => taskRefs.set(task.id, el)}
                  className={`bg-gray-700 rounded-lg p-3 mb-3 cursor-pointer transition-all duration-200 hover:bg-gray-600 ${
                    task.id === selectedTaskId ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setSearchResultIndex(null);
                  }}
                >
                  <h2 className="font-semibold mb-2 text-white text-sm">
                    {todoParentSet?.has(task.id) ? (
                      <Link
                        to={`todos/${task.id}`}
                        className="text-blue-300 hover:text-blue-200 transition-colors duration-200"
                      >
                        {task.content}
                      </Link>
                    ) : (
                      task.content
                    )}
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block ml-2 opacity-50 hover:opacity-100 transition-opacity duration-200"
                    >
                      <img
                        src="/todoist-kanban-vim/open-icon.svg"
                        alt="Open"
                        className="w-3 h-3"
                      />
                    </a>
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {task.labels.map((label) => {
                      if (INDEX_TO_LABEL_MAP.includes(label)) return;

                      if (!(label in labelColors)) {
                        // Generate random values for RGB, but limit the range to darker tones
                        const r = Math.floor(Math.random() * 100);
                        const g = Math.floor(Math.random() * 100);
                        const b = Math.floor(Math.random() * 100);
                        labelColors[label] = `#${r
                          .toString(16)
                          .padStart(2, "0")}${g
                          .toString(16)
                          .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
                      }
                      return (
                        <span
                          key={label}
                          className={`px-2 py-1 rounded-full text-xs font-semibold text-white
                          ${labelColors[label]} bg-opacity-80`}
                          style={{ backgroundColor: labelColors[label] }}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    {selectedProjects.includes("allProjects") ||
                    selectedProjects.length === 0 ? (
                      <span>{projectIdToNameMap?.[task.projectId]}</span>
                    ) : null}
                    {task.due && (
                      <span
                        className={
                          new Date(task.due.datetime || task.due.date) <
                          new Date()
                            ? "text-red-400"
                            : ""
                        }
                      >
                        {task.due.datetime
                          ? new Date(task.due.datetime).toLocaleString()
                          : new Date(task.due.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ) : null;
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
