import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import cv from "@techstark/opencv-js";

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
  greeneryPercentage?: number;
  idleLand?: number;
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
  const [cvReady, setCvReady] = useState(false);
  const [regionAnalyses, setRegionAnalyses] = useState<RegionAnalysis[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedGreenCover, setUploadedGreenCover] = useState<number | null>(null);
  const [uploadedIdleLand, setUploadedIdleLand] = useState<number | null>(null);
  const [uploadedTreeCount, setUploadedTreeCount] = useState<number | null>(null);

  const mapRef = useRef<google.maps.Map>();
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager>();
  const navigate = useNavigate();

  // ✅ OpenCV Initialization
  useEffect(() => {
    if (cv && cv.onRuntimeInitialized) {
      cv.onRuntimeInitialized = () => {
        setCvReady(true);
        console.log("OpenCV.js is ready!");
      };
    }
  }, []);

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

  // ✅ Load Google Maps + Drawing Library
  useEffect(() => {
    if (project && project.location && !mapLoaded) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCpzV2uci8gLyp8si2idL0Gy1PLUe_J8bU&libraries=drawing`;
      script.async = true;
      script.onload = () => initMap();
      document.body.appendChild(script);
      setMapLoaded(true);
    }
  }, [project, mapLoaded]);

  // ✅ Initialize Map & Drawing Tool
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
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ["rectangle"],
      },
    });

    drawingManagerRef.current.setMap(mapRef.current);

    google.maps.event.addListener(drawingManagerRef.current, "overlaycomplete", (event) => {
      const bounds = (event.overlay as google.maps.Rectangle).getBounds();
      analyzeRegion(bounds);
    });
  };

  // ✅ Analyze Region on Map
  const analyzeRegion = async (bounds: google.maps.LatLngBounds) => {
    if (!cvReady) {
      alert("OpenCV is still loading. Try again.");
      return;
    }

    const centerLat = bounds.getCenter().lat();
    const centerLng = bounds.getCenter().lng();
    const proxyUrl = "https://gmap-sih-img-proxy.vipulchaturvedi.workers.dev/";
    const imgUrl = `${proxyUrl}?center=${centerLat},${centerLng}&zoom=15&size=640x640&key=YOUR_API_KEY`;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgUrl;

    img.onload = async () => {
      const { greenPercent, idlePercent, treeCount } = analyzeImgData(img);

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

      setRegionAnalyses((prev) => [
        ...prev,
        { id: prev.length + 1, greenPercent, idlePercent, treeCount, insights },
      ]);
    };
  };

  // ✅ ExG + Otsu + Contours Detection
  const analyzeImgData = (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { greenPercent: 0, idlePercent: 0, treeCount: 0 };

    ctx.drawImage(img, 0, 0);

    // ✅ Fix: Use cv.imread() with a temporary canvas element
    // This is the correct method for browser environments
    document.body.appendChild(canvas);
    const src = cv.imread(canvas);

    let bgr = new cv.Mat();
    cv.cvtColor(src, bgr, cv.COLOR_RGBA2BGR);

    let channels = new cv.MatVector();
    cv.split(bgr, channels);
    let R = channels.get(2), G = channels.get(1), B = channels.get(0);

    // ✅ Excess Green Index: 2G - R - B
    let exg = new cv.Mat();
    cv.addWeighted(G, 2, R, -1, 0, exg);
    cv.addWeighted(exg, 1, B, -1, 0, exg);

    // Normalize & Otsu Thresholding
    cv.normalize(exg, exg, 0, 255, cv.NORM_MINMAX);
    exg.convertTo(exg, cv.CV_8U);
    let binary = new cv.Mat();
    cv.threshold(exg, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

    // ✅ Contour detection for tree count
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const totalPixels = img.width * img.height;
    const greenPixels = cv.countNonZero(binary);
    const greenPercent = Number(((greenPixels / totalPixels) * 100).toFixed(2));
    const treeCount = contours.size();

    // Cleanup
    src.delete();
    bgr.delete();
    R.delete();
    G.delete();
    B.delete();
    exg.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();
    document.body.removeChild(canvas);

    return { greenPercent, idlePercent: Number((100 - greenPercent).toFixed(2)), treeCount };
  };

  // ✅ Analyze Uploaded Image
  const analyzeImage = () => {
    if (!uploadedFile) return toast({ title: "No image", description: "Select an image first." });

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const { greenPercent, idlePercent, treeCount } = analyzeImgData(img);
        setUploadedGreenCover(greenPercent);
        setUploadedIdleLand(idlePercent);
        setUploadedTreeCount(treeCount);
      };
    };
    reader.readAsDataURL(uploadedFile);
  };

  // ✅ Save Analysis
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