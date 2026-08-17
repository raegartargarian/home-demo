import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { appRoutes } from "../constants/routes";

export const BackButton = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if we have history to go back to
    if (window.history.length > 1) {
      navigate(-1); // Go back to previous route
    } else {
      // If no history, navigate to dashboard
      navigate(appRoutes.dashboard.path);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="
          cursor-pointer
          flex items-center gap-3 
          mt-5
          "
    >
      <ArrowLeft size={16} />
      <p className="font-light"> Return Back</p>
    </button>
  );
};
