import { Link } from "react-router-dom";
export const Navbar = () => {
  return (
    <div className="hidden w-full md:block md:w-auto" id="navbar-default">
      <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 bg-[#333333] md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0">
        <li>
          <Link
            to="/"
            className="block py-2 px-3 rounded md:bg-transparent md:p-0 dark:text-white hover:bg-[#717171]"
            aria-current="page"
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            to="/todos"
            className="block py-2 px-3 rounded md:bg-transparent md:p-0 dark:text-white hover:bg-[#717171]"
          >
            Todos
          </Link>
        </li>
      </ul>
    </div>
  );
};
