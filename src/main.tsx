import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from "./error-page";
import { TodoistHome } from "./TodoistHome.tsx";
import TodoistApiHOC from "./TodoistApiHOC.tsx";
import { TodoSubtask } from "./TodoSubtask.tsx";
import { loader as todoSubtaskLoader } from "./todoLoader.tsx";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <TodoistHome />,
        },
        {
          path: "/todos",
          element: <TodoistHome />,
        },
        {
          path: "/todos/:id",
          element: <TodoSubtask />,
          loader: todoSubtaskLoader,
        },
      ],
    },
  ],
  {
    basename: "/todoist-kanban-vim/",
  }
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme>
      <QueryClientProvider client={queryClient}>
        <TodoistApiHOC>
          <RouterProvider router={router} />
          <ReactQueryDevtools initialIsOpen={false} />
        </TodoistApiHOC>
      </QueryClientProvider>
    </Theme>
  </React.StrictMode>
);
