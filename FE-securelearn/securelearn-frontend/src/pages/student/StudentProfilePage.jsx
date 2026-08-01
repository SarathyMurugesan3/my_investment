import { useEffect, useState } from "react";
import { getStudentProfile } from "../../api/contentApi";


const StudentProfilePage = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getStudentProfile()
      .then((res) => setProfile(res.data))
      .catch(console.error);
  }, []);

  if (!profile) {
    return (
      <>
        <div className="text-lg">Loading profile...</div>
      </>
    );
  }

  const getRiskLevel = (score) => {
    if (score >= 50) return "High";
    if (score >= 30) return "Medium";
    if (score > 0) return "Low";
    return "Safe";
  };

  const getRiskColor = (score) => {
    if (score >= 50) return "text-red-600";
    if (score >= 30) return "text-orange-500";
    if (score > 0) return "text-yellow-500";
    return "text-green-600";
  };

  const riskLevel = getRiskLevel(profile.riskScore);
  const riskColor = getRiskColor(profile.riskScore);

  return (
    <>
      <div className="max-w-2xl bg-white text-slate-800 p-8 rounded-xl shadow space-y-6">

        <h1 className="text-3xl font-bold">
          Student Profile
        </h1>

        {/* Blocked Warning */}
        {profile.blocked && (
          <div className="bg-red-100 text-red-700 p-4 rounded">
            Your account is currently blocked due to suspicious activity.
            Please contact support.
          </div>
        )}

        {/* Risk Warning */}
        {!profile.blocked && profile.riskScore >= 30 && (
          <div className="bg-yellow-100 text-yellow-700 p-4 rounded">
            Warning: Suspicious activity detected.
            Continued violations may result in account suspension.
          </div>
        )}

        <div className="space-y-4">

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Email</span>
            <span>{profile.email}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Role</span>
            <span>{profile.role}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Risk Score</span>
            <span className={riskColor}>
              {profile.riskScore}
            </span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Risk Level</span>
            <span className={riskColor}>
              {riskLevel}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Account Status</span>
            <span
              className={
                profile.blocked
                  ? "text-red-600 font-semibold"
                  : "text-green-600 font-semibold"
              }
            >
              {profile.blocked ? "Blocked" : "Active"}
            </span>
          </div>

        </div>

      </div>
    </>
  );
};

export default StudentProfilePage;
