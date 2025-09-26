import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Download, Shield, FileText } from "lucide-react"; 
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ProjectReports() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [reports, setReports] = useState<any[]>([]);
  const [project, setProject] = useState<any>({});
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [reportUpdating, setReportUpdating] = useState<string | null>(null);

  // Fetch reports from backend
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
        { status: newStatus },
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

  // Generate PDF report
  const generatePDFReport = () => {
    const verifiedReports = reports.filter(r => r.status === "Verified");
    const totalCredits = verifiedReports.reduce((sum, r) => sum + (r.credits || 0), 0);
    const totalTrees = verifiedReports.reduce((sum, r) => sum + (r.treeCount || 0), 0);

    const doc = new jsPDF();
    doc.text(`Final MRV and Carbon Credit Report: ${project.title}`, 14, 10);

    const projectInfo = [
      ["Project ID", project._id],
      ["Title", project.title],
      ["Status", project.status],
      ["Area (Ha)", project.areaHectares],
      ["Target Trees", project.targetTrees],
      ["Total Verified Trees", totalTrees],
      ["Total Credits Issued", totalCredits]
    ];

    // Project Info Table
    (doc as any).autoTable({
      head: [["Field", "Value"]],
      body: projectInfo,
      startY: 20,
    });

    // MRV Records Table
    const records = verifiedReports.map((r, i) => [
      i + 1,
      r._id,
      r.treeCount,
      (r.greeneryPercentage || 0).toFixed(2) + "%",
      (r.co2Level || 0).toFixed(2) + " MT",
      r.credits || 0,
      r.status
    ]);

    (doc as any).autoTable({
      head: [["#", "Report ID", "Tree Count", "Greenery %", "CO2 Level", "Credits", "Status"]],
      body: records,
      startY: (doc as any).lastAutoTable.finalY + 10 || 60,
    });

    doc.save(`MRV_Report_${project.title || "Project"}.pdf`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {project.title || "Untitled Project"} - MRV Reports
        </h1>
        <div className="flex gap-2">
          {project.status === "Verified" && (
            <Button
              onClick={generatePDFReport}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" /> Download Final Report (PDF)
            </Button>
          )}
          <Button onClick={() => navigate(`/government/projects/${projectId}`)}>
            Back to Project
          </Button>
        </div>
      </div>

      {/* Project Status */}
      <div className="mb-4 p-4 border rounded-lg bg-gray-50">
        <p>
          <strong className="text-lg flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" /> Current Project Status:
          </strong> 
          <span className="ml-2 font-semibold text-lg">{project.status || "N/A"}</span>
        </p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {["Created", "Assigned", "InProgress", "Completed", "Verified"].map((s) => (
            <Button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={statusUpdating || project.status === s}
              variant={project.status === s ? "default" : "outline"}
              className={project.status === s ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <p>No reports found for this project.</p>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report._id} className="shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-500" /> Report ID: {report._id}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Submitted on: {new Date(report.dateReported).toLocaleDateString()} | Status:{" "}
                  <strong className={report.status === "Verified" ? "text-green-600" : "text-orange-600"}>{report.status}</strong>
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Tree Count:</strong> {report.treeCount}</p>
                    <p><strong>Greenery:</strong> {(report.greeneryPercentage || 0).toFixed(2)}%</p>
                    <p><strong>CO2 Level:</strong> {(report.co2Level || 0).toFixed(2)} MT</p>
                    <p><strong>Verified By:</strong> {report.verifiedBy || "Government"}</p>
                    <p className="truncate"><strong>Blockchain Tx:</strong> {report.blockchainTx || "-"}</p>
                    <p><strong>Notes:</strong> {report.notes || "-"}</p>

                    {report.credits !== undefined && report.credits > 0 && (
                      <p className="mt-2 flex items-center text-green-700 font-semibold text-lg">
                        <span className="mr-2">🪙</span>
                        Credits Issued: {report.credits}
                      </p>
                    )}

                    <div className="mt-4 flex gap-2 items-center flex-wrap">
                      <strong className="text-gray-700 text-sm">Update Status:</strong>
                      {["Pending", "Verified"].map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          onClick={() => handleReportStatusChange(report._id, s)}
                          disabled={reportUpdating === report._id || report.status === s}
                          variant={s === "Verified" ? "default" : "outline"}
                          className={s === "Verified" ? "bg-green-500 hover:bg-green-600 text-white" : "border-gray-300"}
                        >
                          {s === "Verified" ? <Shield className="w-4 h-4 mr-1" /> : null}
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <strong className="w-full text-right text-sm text-gray-700">Drone Imagery:</strong>
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
                      <p className="w-full text-right text-gray-500 italic">No drone images uploaded</p>
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
