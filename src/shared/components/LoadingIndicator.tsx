import { Spinner } from "./Spinner";

export const LoadingIndicator = ({ fullPageHeight = false }) => {
  return (
    <div
      className={
        fullPageHeight
          ? "h-full w-full flex justify-center items-center"
          : "flex justify-center items-center"
      }
    >
      <Spinner size="medium" />
    </div>
  );
};
