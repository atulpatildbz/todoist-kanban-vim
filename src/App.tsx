import "./App.css";
import { TodoistApi } from "@doist/todoist-api-typescript";
import { useMutationTodoistKey, useTodoistKey } from "./hooks/todoistApiKeyHook";
import { TodoistHome } from "./TodoistHome";
import { TodoistContext } from "./contexts/contexts";

// const api = new TodoistApi();
// api
//   .getProjects()
//   .then((projects) => console.log(projects))
//   .catch((error) => console.log(error));
function App() {
  const { data: todoistKey, isLoading } = useTodoistKey();
  console.log(todoistKey);

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
      <TodoistHome />
    </TodoistContext.Provider>
  );
}

export default App;
