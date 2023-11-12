import { useRouteError } from "react-router-dom";

interface RouteError {
  statusText?: string;
  message?: string;
}
export default function ErrorPage() {
  const error = useRouteError() as RouteError;

  return (
    <div
      id="error-page"
      className="flex items-center justify-center h-screen bg-gray-100"
    >
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500">Oops!</h1>
        <p className="text-2xl text-gray-700 mt-4">
          <i>{error.statusText || error.message}</i>
        </p>
      </div>
    </div>
  );
}
