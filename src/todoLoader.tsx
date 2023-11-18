import { LoaderFunction, LoaderFunctionArgs } from "react-router-dom";

interface Params {
  id: string;
}
export const loader: LoaderFunction<Params> = ({
  params,
}: LoaderFunctionArgs<Params>) => {
  return { id: params.id };
};
