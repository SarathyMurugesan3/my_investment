import { useMonitoring } from "../../hooks/useMonitoring";
import BlurOverlay from "../../components/common/BlurOverlay";
import DynamicWatermark from "../../components/watermark/DynamicWatermark";

const StudentDashboard = () => {
  const { isBlurred } = useMonitoring();
  {user?.riskScore > 30 && (
    <div className="bg-yellow-100 text-yellow-700 p-3 rounded mb-4">
      Warning: Suspicious activity detected.
    </div>
  )}

  return (
    <div className="relative min-h-screen p-8 bg-white">
      {isBlurred && <BlurOverlay />}
      <DynamicWatermark />

      <h1 className="text-3xl font-bold">
        Student Dashboard
      </h1>

      <p className="mt-4">
        Secure content area.
      </p>
    </div>
  );
};

export default StudentDashboard;
