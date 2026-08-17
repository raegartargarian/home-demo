import { GlobalSelectors } from "@/containers/global/selectors";
import { useSelector } from "react-redux";

export default function AuthModal() {
  const isAuthModalOpen = useSelector(GlobalSelectors.isAuthModalOpen);
  return isAuthModalOpen ? (
    <div className="w-full h-full fixed top-0 left-0 bg-black bg-opacity-50 flex justify-center items-center z--50 transition-opacity duration-300"></div>
  ) : (
    <></>
  );
}
