import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, TreePalm, Shield, Upload, MapPin, CheckCircle, Clock } from "lucide-react";

// Assuming these component imports exist from your previous code
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Project {
  _id: string;
  title: string;
  areaHectares: number;
  targetTrees: number;
  startDate: string;
  endDate?: string;
  description: string;
  landImages?: string[];
  location?: { type: string; coordinates: [number, number] };
  greeneryPercentage?: number;
  co2Level?: number;
  createdAT: string;
  governmentId: string;
  hasMRVReport: string[];
  ngoID: string;
  requestedBy: string;
  status: string;
  __v: number;
}

interface AnalysisData {
    treeCount: number;
    boxes: any[];
    greeneryPercentage: number;
    co2Level: number;
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const geminiCanvasRef = useRef<HTMLCanvasElement>(null);
    const greenCoverCanvasRef = useRef<HTMLCanvasElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedTreeCount, setUploadedTreeCount] = useState<number | null>(null);

    // State for Client-Side Analysis (will be the primary source for saving greenery)
    const [clientGreenery, setClientGreenery] = useState<number | null>(null);
    const [clientIdleLand, setClientIdleLand] = useState<number | null>(null);
    const [clientAnalysisFile, setClientAnalysisFile] = useState<File | null>(null);


  const formatDate = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleDateString() : "N/A";

  // --- Fetch project from backend (Remains the same) ---
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`http://localhost:4000/api/v1/gov/projects/${projectId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.project) {
          setProject({
            ...data.project,
            description: data.project.description || "No description provided.",
            greeneryPercentage: data.project.greeneryPercentage ?? 0,
            co2Level: data.project.co2Level ?? 0,
          });
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Failed to fetch project data." });
      }
    }
    fetchProject();
  }, [projectId, toast]);

  // --- Gemini Analysis ---
  const analyzeWithGemini = async (file: File) => {
    toast({ title: "Analysis In Progress", description: "Sending image to server for analysis..." });
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("http://localhost:4000/api/v1/gov/gemini/analyze-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Server analysis failed.");
      }

      const data: AnalysisData = await res.json();

      setUploadedTreeCount(data.treeCount);
      // NOTE: Only update CO2 and keep the project's greenery status separate
      setProject(prev =>
        prev
          ? {
              ...prev,
              co2Level: data.co2Level ?? prev.co2Level,
            }
          : prev
      );

      // Draw bounding boxes
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const ctx = geminiCanvasRef.current?.getContext("2d");
        if (!ctx) return;
        geminiCanvasRef.current.width = img.width;
        geminiCanvasRef.current.height = img.height;
        ctx.drawImage(img, 0, 0);
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.font = "16px Arial";

        (data.boxes || []).forEach(b => {
          ctx.strokeRect(b.x1, b.y1, b.x2 - b.x1, b.y2 - b.y1);
          ctx.fillStyle = "#00FF00";
          const text = `Tree ${(b.prob * 100).toFixed(1)}%`;
          const width = ctx.measureText(text).width;
          ctx.fillRect(b.x1, b.y1 - 18, width + 6, 18);
          ctx.fillStyle = "#000000";
          ctx.fillText(text, b.x1 + 3, b.y1 - 3);
        });
      };

      toast({ title: "Analysis Complete", description: `Detected ${data.treeCount} trees.` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: `Analysis failed: ${err.message}` });
    }
  };

  const handleAnalyze = () => {
    if (!uploadedFile) return toast({ title: "Error", description: "Please upload an image." });
    analyzeWithGemini(uploadedFile);
  };

  // --- Client-Side Green Cover Analysis Logic (Refined with ExG) ---
    const analyzeGreenCover = () => {
        if (!clientAnalysisFile) {
            return toast({ title: "Error", description: "Please select an image for Green Cover analysis." });
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = greenCoverCanvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let greenPixelCount = 0;
                const totalPixels = canvas.width * canvas.height;
                
                // Normalize all colors and apply ExG threshold
                const ExG_THRESHOLD = 0.05; // A common threshold for ExG

                for (let i = 0; i < imageData.data.length; i += 4) {
                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    
                    const sum = r + g + b;
                    
                    // Avoid division by zero
                    if (sum === 0) {
                        // Mark as black/non-vegetation
                        imageData.data[i] = 0;
                        imageData.data[i + 1] = 0;
                        imageData.data[i + 2] = 0;
                        imageData.data[i + 3] = 255;
                        continue;
                    }

                    // Normalize R, G, B
                    const r_norm = r / sum;
                    const g_norm = g / sum;
                    const b_norm = b / sum;

                    // Calculate Excess Green Index (ExG): ExG = 2 * g_norm - r_norm - b_norm
                    const exg = (2 * g_norm) - r_norm - b_norm;

                    if (exg > ExG_THRESHOLD) {
                        // Mark as green/white (Vegetation)
                        imageData.data[i] = 255;
                        imageData.data[i + 1] = 255;
                        imageData.data[i + 2] = 255;
                        greenPixelCount++;
                    } else {
                        // Mark as non-green/black (Idle land/Soil)
                        imageData.data[i] = 0;
                        imageData.data[i + 1] = 0;
                        imageData.data[i + 2] = 0;
                    }
                    imageData.data[i + 3] = 255; // Alpha
                }

                ctx.putImageData(imageData, 0, 0);

                const coveragePct = (greenPixelCount / totalPixels) * 100;
                const idlePct = 100 - coveragePct;
                
                setClientGreenery(coveragePct);
                setClientIdleLand(idlePct);
                
                toast({ title: "Analysis Complete", description: `Green Cover: ${coveragePct.toFixed(2)}%` });
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(clientAnalysisFile);
    };

  // --- Save Analysis (Updated to use clientGreenery) ---
  const saveAnalysis = async () => {
    // CRITICAL: Ensure clientGreenery is available, otherwise use existing project value
    const greeneryToSave = clientGreenery !== null ? clientGreenery : (project.greeneryPercentage ?? 0);
    
    if (!project || uploadedTreeCount === null) return;
    try {
      await fetch(`http://localhost:4000/api/v1/gov/${project._id}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          treeCount: uploadedTreeCount,
          // *** USING CLIENT-SIDE GREENERY FOR SAVE ***
          greeneryPercentage: greeneryToSave, 
          // ----------------------------------------
          co2Level: project.co2Level,
        }),
      });
      toast({ title: "Saved", description: "Analysis saved successfully!" });
      navigate("/government");
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save analysis." });
    }
  };

  if (!project) return <div className="p-6">Loading project...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4 text-green-700">🌳 Project: {project.title}</h1>

      {/* Project Metadata (Remains the same) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-5 border rounded-xl shadow-lg bg-gray-50">
        <h2 className="text-xl font-semibold col-span-full border-b pb-2 mb-3 text-gray-700">Project Metadata</h2>
        {/* ... (Metadata content remains the same) ... */}
        <p><strong>Project ID:</strong> <span className="font-mono text-sm">{project._id}</span></p>
        <p><strong>Title:</strong> <span className="font-bold">{project.title}</span></p>
        <p><strong>Status:</strong> <span className={`font-bold p-1 rounded-md text-white ${ project.status === "Verified" ? "bg-green-500" : "bg-yellow-500" }`}>{project.status}</span></p>
        <p><strong>Government ID:</strong> <span className="font-mono text-sm">{project.governmentId}</span></p>
        <p><strong>NGO ID:</strong> <span className="font-mono text-sm">{project.ngoID}</span></p>
        <p><strong>Requested By:</strong> <span className="font-mono text-sm">{project.requestedBy}</span></p>
        <p><strong>Area:</strong> <span className="font-bold text-lg">{project.areaHectares}</span> hectares</p>
        <p><strong>Target Trees:</strong> <span className="font-bold text-lg">{project.targetTrees}</span></p>
        <p><strong>MRV Report:</strong> {project.hasMRVReport?.length ? "Yes" : "No"}</p>
        <p><strong>Start Date:</strong> {formatDate(project.startDate)}</p>
        <p><strong>End Date:</strong> {formatDate(project.endDate)}</p>
        <p><strong>Created On:</strong> {formatDate(project.createdAT)}</p>
        <p className="col-span-full"><strong>Location:</strong> {project.location?.coordinates.join(", ") || "N/A"} ({project.location?.type || "Point"})</p>
      </div>

      {/* CO2 and Greenery (Displaying client result if available) */}
      <div className="mb-6 p-5 border rounded-xl shadow-lg bg-teal-50 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <h2 className="text-xl font-semibold col-span-full border-b border-teal-200 pb-2 mb-3 text-teal-800">Carbon & Greenery Metrics</h2>

        <div className="bg-white p-3 rounded-lg border border-teal-300">
          <p className="text-gray-600">🌳 Greenery Percentage:</p>
          <p className="text-2xl font-extrabold text-green-700">
                {/* Display client result if calculated, otherwise show project data */}
            {(clientGreenery ?? project.greeneryPercentage)?.toFixed(2) ?? 0}%
          </p>
        </div>

        <div className="bg-white p-3 rounded-lg border border-teal-300">
          <p className="text-gray-600">💨 CO2 Level (Metric Tons):</p>
          <input
            type="number"
            step="0.01"
            value={project.co2Level ?? 0}
            onChange={e =>
              setProject(prev => (prev ? { ...prev, co2Level: parseFloat(e.target.value) } : prev))
            }
            className="border p-1 rounded w-full text-red-700 font-bold text-lg"
          />
        </div>

        <div className="bg-white p-3 rounded-lg border border-teal-300">
          <p className="text-gray-600">🌲 Last Analyzed Count:</p>
          <p className="text-2xl font-extrabold text-blue-700">{uploadedTreeCount ?? "N/A"}</p>
        </div>
      </div>

      <hr className="my-6" />

      {/* --- TABBED ANALYSIS SECTION --- */}
      <Tabs defaultValue="gemini" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gemini">Tree Count & Initial Metrics</TabsTrigger>
              <TabsTrigger value="green-cover">Green Cover Estimate (Client-Side)</TabsTrigger>
          </TabsList>

          {/* TAB 1: Gemini Analysis */}
          <TabsContent value="gemini" className="space-y-4 p-4 border rounded-xl bg-white shadow-md">
                <h3 className="text-xl font-semibold text-gray-700">Image Analysis (Tree Counting)</h3>

                {/* Upload Controls */}
                <div className="flex items-center space-x-4">
                    <Label className="w-1/4">Upload Image:</Label>
                    <Input
                        type="file"
                        accept="image/*"
                        className="flex-grow"
                        onChange={e => {
                            setUploadedTreeCount(null);
                            e.target.files?.[0] && setUploadedFile(e.target.files[0]);
                        }}
                    />
                    <Button
                        onClick={handleAnalyze}
                        disabled={!uploadedFile}
                        className={`bg-green-600 hover:bg-green-700`}
                    >
                        <Upload className="w-4 h-4 mr-1" /> Analyze
                    </Button>
                </div>

                {/* Analysis Output (from Gemini) */}
                {uploadedTreeCount !== null && (
                    <div className="p-4 bg-lime-100 rounded-lg border border-lime-300">
                        <h4 className="font-bold text-lg text-lime-800">Gemini Results:</h4>
                        <p>🌲 **Detected Tree Count:** <span className="font-extrabold">{uploadedTreeCount}</span></p>
                        <p>🌳 **Greenery % (Estimate):** <span className="font-bold">{project.greeneryPercentage?.toFixed(2) ?? 0}%</span></p>
                    </div>
                )}
                
                {/* Canvas for Bounding Boxes */}
                <h3 className="text-xl font-semibold mb-2 text-gray-700 pt-4 border-t">Image View</h3>
                <canvas
                    ref={geminiCanvasRef} // Use geminiCanvasRef here
                    style={{ maxWidth: "100%", border: "2px solid #ccc", minHeight: uploadedFile ? "200px" : "50px", display: uploadedFile ? "block" : "none" }}
                    className="rounded-lg shadow-inner"
                />
                {!uploadedFile && <p className="text-gray-500 italic">Upload an image to see detection results.</p>}

                {/* Save Button */}
                {uploadedTreeCount !== null && (
                    <Button
                        onClick={saveAnalysis}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium w-full"
                    >
                        Save Analysis to Database
                    </Button>
                )}
          </TabsContent>
          
          {/* TAB 2: Client-Side Green Cover Analysis */}
          <TabsContent value="green-cover" className="space-y-4 p-4 border rounded-xl bg-white shadow-md">
                <h3 className="text-xl font-semibold text-gray-700 flex items-center">
                    <TreePalm className="w-5 h-5 mr-2" /> Client-Side Greenery Estimator
                </h3>

                {/* Upload Controls for Client-Side */}
                <div className="flex items-center space-x-4">
                    <Label className="w-1/4">Upload Image:</Label>
                    <Input
                        type="file"
                        accept="image/*"
                        className="flex-grow"
                        onChange={e => {
                            setClientGreenery(null);
                            setClientIdleLand(null);
                            e.target.files?.[0] && setClientAnalysisFile(e.target.files[0]);
                        }}
                    />
                    <Button
                        onClick={analyzeGreenCover}
                        disabled={!clientAnalysisFile}
                        className={`bg-indigo-600 hover:bg-indigo-700`}
                    >
                        <Upload className="w-4 h-4 mr-1" /> Process Locally
                    </Button>
                </div>

                {/* Analysis Results */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="p-4 bg-lime-50 rounded border border-lime-300">
                        <h4 className="text-sm font-semibold text-lime-800">Green Cover Percentage:</h4>
                        <p className="text-2xl font-extrabold text-green-700">{clientGreenery !== null ? clientGreenery.toFixed(2) + '%' : 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded border border-red-300">
                        <h4 className="text-sm font-semibold text-red-800">Idle Land Percentage:</h4>
                        <p className="text-2xl font-extrabold text-red-700">{clientIdleLand !== null ? clientIdleLand.toFixed(2) + '%' : 'N/A'}</p>
                    </div>
                </div>

                {/* Processed Image Display */}
                <h3 className="text-xl font-semibold mb-2 text-gray-700 pt-4 border-t">Processed Image View (Thresholded)</h3>
                <canvas
                    ref={greenCoverCanvasRef} // Use greenCoverCanvasRef here
                    style={{ maxWidth: "100%", border: "2px solid #ccc", minHeight: clientAnalysisFile ? "200px" : "50px", display: clientAnalysisFile ? "block" : "none" }}
                    className="rounded-lg shadow-inner"
                />
                {!clientAnalysisFile && <p className="text-gray-500 italic">Processed image will appear here after analysis.</p>}
          </TabsContent>
      </Tabs>
      {/* --- END TABBED ANALYSIS SECTION --- */}

    </div>
  );
}