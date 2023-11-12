import { TodoistApi } from "@doist/todoist-api-typescript";
import {
  useMutationTodoistKey,
  useTodoistKey,
} from "./hooks/todoistApiKeyHook";
import { TodoistContext } from "./contexts/contexts";

type TodoistApiHOCProps = {
  children: React.ReactNode;
};

function TodoistApiHOC({ children }: TodoistApiHOCProps) {
  const { data: todoistKey, isLoading } = useTodoistKey();
  const mutation = useMutationTodoistKey();

  if (isLoading) {
    return "Loading...";
  }

  if (!todoistKey || typeof todoistKey !== "string") {
    return (
      <form
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          const key = formData.get("key") as string;
          mutation.mutate(key);
        }}
      >
        <input
          name="key"
          className="border-2 border-gray-300 p-2 w-full"
          placeholder="Enter Todoist API Key"
        />
        <button type="submit" className="p-2 bg-blue-500 text-white mt-2">
          Submit
        </button>
      </form>
    );
  }
  const api = new TodoistApi(todoistKey);
  return (
    <TodoistContext.Provider value={api}>
      {children}
      {/* <TodoistHome /> */}
    </TodoistContext.Provider>
  );
}

export default TodoistApiHOC;
