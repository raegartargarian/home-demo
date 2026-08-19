import { Button } from "@/components/ui/button";
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
    <Button variant="ghost" size="sm" onClick={handleBack} className="mt-5">
      <ArrowLeft />
      Return Back
    </Button>
  );
};
