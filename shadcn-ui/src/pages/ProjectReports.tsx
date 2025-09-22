import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";

export default function ProjectReports() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [reports, setReports] = useState<any[]>([]);
  const [project, setProject] = useState<any>({});
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [reportUpdating, setReportUpdating] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/v1/gov/projects/${projectId}/reports`,
        { withCredentials: true }
      );
      if (res.data?.success) {
        const sortedReports = (res.data.reports || []).sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setReports(sortedReports);
        setProject(res.data.project || {});
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [projectId]);

  // Change project status
  const handleStatusChange = async (newStatus: string) => {
    if (!projectId) return;
    setStatusUpdating(true);
    try {
      const res = await axios.patch(
        `http://localhost:4000/api/v1/gov/projects/${projectId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      if (res.data?.success) {
        setProject({ ...project, status: newStatus });
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Change individual report status
  const handleReportStatusChange = async (reportId: string, newStatus: string) => {
    setReportUpdating(reportId);
    try {
      const res = await axios.patch(
        `http://localhost:4000/api/v1/gov/reports/${reportId}/status`,
        { status: newStatus }, // backend calculates credits automatically
        { withCredentials: true }
      );

      if (res.data?.success) {
        setReports((prev) =>
          prev.map((r) =>
            r._id === reportId
              ? { ...r, status: newStatus, credits: res.data.record.credits }
              : r
          )
        );
      }
    } catch (err) {
      console.error("Error updating report status:", err);
    } finally {
      setReportUpdating(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {project.title || "Untitled Project"} - MRV Reports
        </h1>
        <Button onClick={() => navigate(`/government/projects/${projectId}`)}>Back to Project</Button>
      </div>

      {/* Project status */}
      <div className="mb-4">
        <p>
          <strong>Current Project Status:</strong> {project.status || "N/A"}
        </p>
        <div className="flex gap-2 mt-2">
          {["Created", "Assigned", "InProgress", "Completed", "Verified"].map((s) => (
            <Button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={statusUpdating || project.status === s}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Reports */}
      {reports.length === 0 ? (
        <p>No reports found for this project.</p>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report._id} className="shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle>Report ID: {report._id}</CardTitle>
                <p className="text-sm text-gray-500">
                  Submitted on: {new Date(report.dateReported).toLocaleDateString()} | Status:{" "}
                  <strong>{report.status}</strong>
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {/* Left side info */}
                  <div>
                    <p><strong>Tree Count:</strong> {report.treeCount}</p>
                    <p><strong>Verified By:</strong> {report.verifiedBy || "-"}</p>
                    <p><strong>Blockchain Tx:</strong> {report.blockchainTx || "-"}</p>
                    <p><strong>Notes:</strong> {report.notes || "-"}</p>

                    {/* Credits display */}
                    {report.credits !== undefined && report.credits > 0 && (
                      <p className="mt-2 flex items-center text-yellow-700 font-semibold">
                        <span className="mr-2">🪙</span>
                        Earned Credits: {report.credits}
                      </p>
                    )}

                    {/* Status buttons */}
                    <div className="mt-2 flex gap-2 items-center">
                      {["Pending", "Verified"].map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          onClick={() => handleReportStatusChange(report._id, s)}
                          disabled={reportUpdating === report._id || report.status === s}
                          className={s === "Verified" ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Right side: drone images */}
                  <div className="flex flex-wrap gap-2">
                    {report.droneImages && report.droneImages.length > 0 ? (
                      report.droneImages.map((img: string, idx: number) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Drone ${idx + 1}`}
                          className="w-32 h-32 object-cover rounded border border-gray-300"
                        />
                      ))
                    ) : (
                      <p>No drone images uploaded</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
