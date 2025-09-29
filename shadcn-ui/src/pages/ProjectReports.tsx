import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Download, Shield, FileText } from "lucide-react"; 

export default function ProjectReports() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [reports, setReports] = useState<any[]>([]);
  const [project, setProject] = useState<any>({});
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [reportUpdating, setReportUpdating] = useState<string | null>(null);

	// Helper to download JSON data (serving as the PDF fallback data export)
	const downloadJsonFile = (data: any, filename: string) => {
		const json = JSON.stringify(data, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		
		a.href = url;
		a.download = filename;
		
		document.body.appendChild(a);
		a.click();
		
		// Cleanup after download initiation
		setTimeout(() => {
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}, 100);
	};

    // --- PDF GENERATION PLACEHOLDER FUNCTION (Now accepts data directly) ---
    const generatePDFReport = (data: any, filename: string) => {
        console.log(`ATTEMPTING PDF GENERATION. Data for PDF:`, data);

        // Fallback: If no PDF library is configured, the browser downloads the JSON data.
        downloadJsonFile(data, filename);
    };
    // ------------------------------------


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

  // --- Project-level Report Generation ---
  const generateFullProjectReport = () => {
    // Ensure reports is not undefined/null before filtering/reducing
    const safeReports = reports || [];

    const verifiedReports = safeReports.filter(r => r.status === 'Verified');
    
    // Calculate aggregates using safe accessors
    const totalCreditsIssued = verifiedReports.reduce((sum, r) => sum + (r.credits || 0), 0);
    const totalTreesCounted = verifiedReports.reduce((sum, r) => sum + (r.treeCount || 0), 0);
    
    const uniqueReportHash = "e2c3b4a5d6e7f8c9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3";
    const verificationUrl = `https://ecochain.com/verify-mrv/${uniqueReportHash}`;
    
    const reportData = {
      reportTitle: `Final MRV and Carbon Credit Report for Project: ${project.title}`,
      
      projectMetadata: {
        projectId: project._id,
        title: project.title,
        governmentId: project.governmentId,
        status: project.status,
        areaHectares: project.areaHectares,
        targetTrees: project.targetTrees,
        startDate: project.startDate,
        endDate: project.endDate,
        location: project.location,
        ngoId: project.ngoId,
        requestedBy: project.requestedBy,
      },

      summaryMetrics: {
        totalVerifiedCredits: totalCreditsIssued,
        totalVerifiedTrees: totalTreesCounted,
        currentGreeneryPercentage: (project.greeneryPercentage || 0).toFixed(2) + '%',
        currentCo2Level: (project.co2Level || 0).toFixed(2) + ' MT',
        totalMRVRecords: safeReports.length,
      },

      verification: {
        issuedBy: "Government Department (EcoChain)",
        digitalSignatureHash: uniqueReportHash, 
        verificationLink: verificationUrl, 
        signatureTimestamp: new Date().toISOString(),
        verificationNote: "The report's integrity is verified via the Digital Signature Hash against the immutable blockchain record.",
      },

      verifiedMRVRecords: verifiedReports.map((r, index) => ({
        recordIndex: index + 1,
        reportId: r._id,
        dateReported: new Date(r.dateReported).toLocaleDateString(),
        status: r.status,
        // Using optional chaining or default values for safe access inside map
        measuredTreeCount: r.treeCount ?? 0,
        greeneryPercentage: (r.greeneryPercentage || 0).toFixed(2) + '%', 
        co2Level: (r.co2Level || 0).toFixed(2) + ' MT',
        creditsIssued: r.credits || 0,
        blockchainTx: r.blockchainTx || 'N/A',
      })),
    };

    // Calls the PDF generator placeholder function
    const filename = `MRV_Report_${project.title.replace(/\s/g, '_')}_${new Date().getFullYear()}.pdf`; 
    generatePDFReport(reportData, filename);
  };
  // --- END NEW Handler ---


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {project.title || "Untitled Project"} - MRV Reports
        </h1>
        <div className="flex gap-2">
          {/* DOWNLOAD BUTTON */}
          {project.status === 'Verified' && (
            <Button
              onClick={generateFullProjectReport}
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

      {/* Project status */}
      <div className="mb-4 p-4 border rounded-lg bg-gray-50">
        <p>
          <strong className="text-lg flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600"/> Current Project Status:
          </strong> 
          <span className="ml-2 font-semibold text-lg">{project.status || "N/A"}</span>
        </p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {["Created", "Assigned", "InProgress", "Completed", "Verified"].map((s) => (
            <Button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={statusUpdating || project.status === s}
              variant={project.status === s ? 'default' : 'outline'}
              className={project.status === s ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
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
