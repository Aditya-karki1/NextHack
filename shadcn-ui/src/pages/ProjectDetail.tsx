import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams, useNavigate } from "react-router-dom";

interface Project {
  _id: string;
  title: string;
  areaHectares: number;
  targetTrees: number;
  startDate: string;
  endDate?: string;
  description: string;
  landImages?: string[];
  location?: { coordinates: [number, number] };
}

interface RegionAnalysis {
  id: number;
  greenPercent: number;
  idlePercent: number;
  treeCount: number;
  insights?: {
    climateBenefits?: string;
    risks?: string;
    suggestions?: string;
  };
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [regionAnalyses, setRegionAnalyses] = useState<RegionAnalysis[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedGreenCover, setUploadedGreenCover] = useState<number | null>(null);
  const [uploadedIdleLand, setUploadedIdleLand] = useState<number | null>(null);
  const [uploadedTreeCount, setUploadedTreeCount] = useState<number | null>(null);

  const mapRef = useRef<google.maps.Map>();
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager>();
  const navigate = useNavigate();

  // ✅ OpenCV is no longer used, so remove the cvReady state and the useEffect hook.

  // ✅ Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/v1/gov/projects/${projectId}`, {
          credentials: "include",
        });
        const data = await res.json();
        setProject(data.project || null);
      } catch (err) {
        console.error("Failed to fetch project:", err);
      }
    };
    fetchProject();
  }, [projectId]);

  // ✅ Load Google Maps & Drawing Tools
  useEffect(() => {
    if (project?.location && !mapLoaded) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCpzV2uci8gLyp8si2idL0Gy1PLUe_J8bU&libraries=drawing`;
      script.async = true;
      script.onload = () => initMap();
      document.body.appendChild(script);
      setMapLoaded(true);
    }
  }, [project, mapLoaded]);

  // ✅ Initialize Map
  const initMap = () => {
    if (!project?.location) return;
    const [lng, lat] = project.location.coordinates;

    mapRef.current = new google.maps.Map(document.getElementById("map") as HTMLElement, {
      center: { lat, lng },
      zoom: 14,
    });

    new google.maps.Marker({ position: { lat, lng }, map: mapRef.current, title: project.title });

    drawingManagerRef.current = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
      drawingControl: true,
      drawingControlOptions: { position: google.maps.ControlPosition.TOP_CENTER, drawingModes: ["rectangle"] },
    });

    drawingManagerRef.current.setMap(mapRef.current);

    google.maps.event.addListener(drawingManagerRef.current, "overlaycomplete", (event) => {
      const bounds = (event.overlay as google.maps.Rectangle).getBounds();
      analyzeRegion(bounds);
    });
  };

  // ✅ New Canvas-based Analysis Function
  const analyzeImgDataCanvas = (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return { greenPercent: 0, idlePercent: 0, treeCount: 0 };

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let greenPixelCount = 0;

    // Calculate the mean green value
    let totalGreen = 0;
    for (let i = 1; i < imageData.data.length; i += 4) {
      totalGreen += imageData.data[i];
    }
    const meanGreen = totalGreen / (imageData.data.length / 4);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const greenValue = imageData.data[i + 1];

      // A simple threshold to detect "green" based on the mean green value
      if (greenValue > meanGreen * 1.5) { // Adjusted logic for better results
        greenPixelCount++;
      }
    }

    const totalPixels = canvas.width * canvas.height;
    const greenPercent = Number(((greenPixelCount / totalPixels) * 100).toFixed(2));
    const idlePercent = Number((100 - greenPercent).toFixed(2));

    // This method does not count trees, so we return a placeholder.
    const treeCount = 0; 

    return { greenPercent, idlePercent, treeCount };
  };

  // ✅ Analyze Region from Google Maps (Updated to use the new function)
  const analyzeRegion = async (bounds: google.maps.LatLngBounds) => {
    const centerLat = bounds.getCenter().lat();
    const centerLng = bounds.getCenter().lng();
    const proxyUrl = "https://gmap-sih-img-proxy.vipulchaturvedi.workers.dev/";
    const imgUrl = `${proxyUrl}?center=${centerLat},${centerLng}&zoom=15&size=640x640&key=AIzaSyCpzV2uci8gLyp8si2idL0Gy1PLUe_J8bU`;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgUrl;

    img.onload = async () => {
      const { greenPercent, idlePercent, treeCount } = analyzeImgDataCanvas(img);

      let insights = { climateBenefits: "", risks: "", suggestions: "" };
      try {
        const response = await fetch("http://localhost:5000/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ greenCover: greenPercent, idleLand: idlePercent }),
        });
        const data = await response.json();
        insights = data.analysis || {};
      } catch (err) {
        console.error(err);
      }

      setRegionAnalyses((prev) => [...prev, { id: prev.length + 1, greenPercent, idlePercent, treeCount, insights }]);
    };
  };

  // ✅ Analyze Uploaded Image (Updated to use the new function)
  const analyzeImage = () => {
    if (!uploadedFile) {
      return toast({ title: "No image", description: "Select an image first." });
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const { greenPercent, idlePercent, treeCount } = analyzeImgDataCanvas(img);
        setUploadedGreenCover(greenPercent);
        setUploadedIdleLand(idlePercent);
        setUploadedTreeCount(treeCount);
      };
    };
    reader.readAsDataURL(uploadedFile);
  };
 
  // ✅ Save Uploaded Analysis
  const saveAnalysis = async () => {
    if (!project || uploadedGreenCover === null || uploadedIdleLand === null) return;
    try {
      await fetch(`http://localhost:4000/api/v1/gov/projects/${project._id}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ greenCover: uploadedGreenCover, idleLand: uploadedIdleLand }),
      });
      toast({ title: "Saved", description: "Analysis saved successfully!" });
      navigate("/government");
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to save analysis." });
    }
  };

  if (!project) return <div>Loading project...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">{project.title}</h1>
      <p className="my-2">{project.description}</p>
      <p>Area: {project.areaHectares} hectares | Target Trees: {project.targetTrees}</p>

      <div id="map" style={{ height: "500px", width: "90%", margin: "20px auto", border: "1px solid #ccc" }} />

      {regionAnalyses.map((region) => (
        <div key={region.id} className="my-4 p-4 bg-green-100 rounded">
          <h2 className="font-bold">Region {region.id}</h2>
          <p>🌳 Green Cover: {region.greenPercent}%</p>
          <p>🏜️ Idle Land: {region.idlePercent}%</p>
          <p>🌲 Tree Count: {region.treeCount}</p>
          <p>🌍 Climate Benefits: {region.insights?.climateBenefits || "N/A"}</p>
          <p>⚠️ Risks: {region.insights?.risks || "N/A"}</p>
          <p>💡 Suggestions: {region.insights?.suggestions || "N/A"}</p>
        </div>
      ))}

      <div className="my-4">
        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setUploadedFile(e.target.files[0])} />
        <button onClick={analyzeImage} className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Analyze Uploaded Image
        </button>
      </div>

      {uploadedGreenCover !== null && uploadedIdleLand !== null && (
        <div className="my-4 p-4 bg-green-200 rounded">
          <h2 className="font-bold">📤 Uploaded Image Analysis</h2>
          <p>🌳 Green Cover: {uploadedGreenCover}%</p>
          <p>🏜️ Idle Land: {uploadedIdleLand}%</p>
          <p>🌲 Tree Count: {uploadedTreeCount}</p>
          <button onClick={saveAnalysis} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Save Uploaded Analysis
          </button>
        </div>
      )}
    </div>
  );
}