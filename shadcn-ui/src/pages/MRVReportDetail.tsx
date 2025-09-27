import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, FileText, TreePalm, Fingerprint, Coins, Upload } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component

// Define the interface for the MRV Report data structure
interface MRVReport {
  _id: string;
  projectId: string;
  externalProjectId: string | null;
  userId: string;
  dateReported: string;
  treeCount: number;
  droneImages: string[];
  status: string;
  createdAt: string;
  __v: number;
  blockchainTx: string;
}

// Define the structure for the analysis response (from your API)
interface AnalysisData {
    treeCount: number;
    boxes: any[]; // Placeholder for bounding box array
    greeneryPercentage: number;
    co2Level: number;
}

export default function MRVReportDetail() {
  const { mrvId } = useParams<{ mrvId: string }>(); 
  const { toast } = useToast();
  const navigate = useNavigate();

  const [report, setReport] = useState<MRVReport | null>(null);
  const [loading, setLoading] = useState(true);
    
    // --- ANALYSIS STATE ---
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzedTreeCount, setAnalyzedTreeCount] = useState<number | null>(null);
  const [analyzedGreenery, setAnalyzedGreenery] = useState<number>(0);
  const [estimatedCo2Level, setEstimatedCo2Level] = useState<number>(0); // Estimated from Gemini
    // ----------------------

  // --- Utility to format date ---
  const formatDate = (dateString?: string, includeTime = false) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (includeTime) {
      return date.toLocaleString();
    }
    return date.toLocaleDateString();
  };

  // --- Fetch MRV Report Data ---
  useEffect(() => {
    if (!mrvId) {
        setLoading(false);
        toast({ title: "Error", description: "MRV Report ID is missing." });
        return;
    }

    async function fetchReport() {
      try {
        setLoading(true);
        
        // NOTE: Replace this mock block with actual fetch logic when API is ready
        const mockData: MRVReport = {
          _id: mrvId,
          projectId: '68d07d78caeed840274f102f',
          externalProjectId: null,
          userId: '68d07b3bcaeed840274f0fed',
          dateReported: '2025-09-21T00:00:00.000+00:00',
          treeCount: 89,
          droneImages: ['https://via.placeholder.com/150/00FF00/000000?text=Tree+Image+1'],
          status: 'Verified',
          createdAt: '2025-09-21T22:35:09.275+00:00',
          __v: 0,
          blockchainTx: '0xe77756da3021b195f44f1e4b45ae1b0da9fb0547c4f860159e8a31ecccb',
        };
        const data = { report: mockData };
        // End mock block

        if (data.report) {
          setReport(data.report);
          // Initialize analysis state with current report data
          setAnalyzedTreeCount(data.report.treeCount);
        } else {
          toast({ title: "Not Found", description: "MRV Report not found." });
        }
      } catch (err) {
        console.error("Failed to fetch report:", err);
        toast({ title: "Error", description: "Failed to fetch MRV report data." });
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [mrvId, toast]);
  
  // --- Gemini Analysis Handler ---
  const analyzeWithGemini = async () => {
    if (!uploadedFile) return toast({ title: "Error", description: "Please upload an image for analysis." });

    toast({ title: "Analysis In Progress", description: "Sending image to server for Gemini analysis..." });
    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);

      // Call the external Gemini API endpoint defined in your backend
      const res = await fetch("http://localhost:4000/api/v1/gov/gemini/analyze-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Server analysis failed.");
      }

      const data: AnalysisData = await res.json();

      // Update state with analysis results received from the backend
      setAnalyzedTreeCount(data.treeCount);
      setAnalyzedGreenery(data.greeneryPercentage ?? 0);
      setEstimatedCo2Level(data.co2Level ?? 0); 

      toast({ title: "Analysis Complete", description: `Detected ${data.treeCount} trees. Greenery: ${data.greeneryPercentage}%` });

    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: `Analysis failed: ${err.message}` });
    }
  };


  if (loading) return <div className="p-6">Loading MRV Report...</div>;
  if (!report) return <div className="p-6 text-red-600">MRV Report data is unavailable.</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center text-blue-700">
        <FileText className="w-8 h-8 mr-3" /> MRV Report: {report._id.substring(0, 8)}...
      </h1>

      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back to Projects
      </button>

        {/* --- ANALYSIS AND DISPLAY SECTION --- */}
      <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Image Analysis & Data Input 📸</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-end">
            <div className="flex-grow w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Drone Image</label>
                <input
                    type="file"
                    accept="image/*"
                    className="p-2 border rounded w-full"
                    onChange={e => setUploadedFile(e.target.files?.[0] || null)}
                />
            </div>
            <Button
                onClick={analyzeWithGemini}
                disabled={!uploadedFile}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
                <Upload className="w-4 h-4 mr-2" /> Analyze Image
            </Button>
        </div>

        {/* Results and Manual Input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
            
            <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">🌲 Detected Tree Count</p>
                <p className="text-2xl font-extrabold text-blue-700">{analyzedTreeCount ?? report.treeCount}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">🌳 Greenery Percentage (Gemini)</p>
                <p className="text-2xl font-extrabold text-green-700">{(analyzedGreenery ?? 0).toFixed(2)}%</p>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded">
                <p className="text-sm text-gray-600">💨 Estimated CO2 (Metric Tons)</p>
                <p className="text-2xl font-extrabold text-red-700">{(estimatedCo2Level ?? 0).toFixed(2)}</p>
            </div>
            
        </div>
      </div>
        {/* --- END ANALYSIS SECTION --- */}

      {/* --- Existing Report Summary Card (using original report data) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Trees Counted (Original Report)</p>
          <p className="text-3xl font-extrabold text-green-600 flex items-center">
            <TreePalm className="w-6 h-6 mr-2" /> {report.treeCount}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-3xl font-extrabold flex items-center">
            <CheckCircle className={`w-6 h-6 mr-2 ${report.status === 'Verified' ? 'text-green-500' : 'text-yellow-500'}`} /> {report.status}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-indigo-500">
          <p className="text-sm text-gray-500">Report Date</p>
          <p className="text-xl font-bold text-indigo-600 flex items-center">
            <Clock className="w-5 h-5 mr-2" /> {formatDate(report.dateReported)}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">Created At</p>
          <p className="text-xl font-bold text-purple-600">
             {formatDate(report.createdAt, true)}
          </p>
        </div>
      </div>

      {/* Technical and Blockchain Details */}
      <div className="bg-white p-6 rounded-xl shadow-lg border space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2 mb-4 text-gray-700">Technical & Blockchain Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <p>
                <strong className="text-gray-600 flex items-center"><Fingerprint className="w-4 h-4 mr-2" /> Project ID:</strong> 
                <span className="font-mono text-sm break-all">{report.projectId}</span>
            </p>
            <p>
                <strong className="text-gray-600 flex items-center"><Coins className="w-4 h-4 mr-2" /> User ID:</strong> 
                <span className="font-mono text-sm break-all">{report.userId}</span>
            </p>
            <p className="md:col-span-2">
                <strong className="text-gray-600 flex items-center"><Fingerprint className="w-4 h-4 mr-2" /> Blockchain TX Hash:</strong> 
                <span className="font-mono text-sm text-red-500 break-all">{report.blockchainTx}</span>
            </p>
        </div>

        {/* Drone Image Display */}
        <h3 className="text-xl font-semibold pt-4 border-t mt-4">Drone Imagery ({report.droneImages.length} available)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {report.droneImages.map((imgUrl, index) => (
            <img
              key={index}
              src={imgUrl}
              alt={`Drone Image ${index + 1}`}
              className="w-full h-auto rounded-lg shadow-md border object-cover"
            />
          ))}
          {report.droneImages.length === 0 && (
            <p className="text-gray-500 italic col-span-full">No drone images uploaded for this report.</p>
          )}
        </div>
      </div>
    </div>
  );
}