// pages/ProjectDetail.tsx
import { useEffect, useState, useRef } from "react";
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate } from "react-router-dom";

/// <reference types="@types/google.maps" />

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

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);

  // Auto map analysis
  const [autoGreenCover, setAutoGreenCover] = useState<number | null>(null);
  const [autoIdleLand, setAutoIdleLand] = useState<number | null>(null);

  // Uploaded image analysis
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedGreenCover, setUploadedGreenCover] = useState<number | null>(null);
  const [uploadedIdleLand, setUploadedIdleLand] = useState<number | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const navigate = useNavigate();
  const mapRef = useRef<google.maps.Map>();

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/v1/gov/projects/${projectId}`, {
          credentials: "include",
        });
        const data = await res.json();
        setProject(
          data.project || {
            _id: "",
            title: "",
            areaHectares: 0,
            targetTrees: 0,
            description: "",
            landImages: [],
          }
        );
      } catch (err) {
        console.error("Failed to fetch project:", err);
        setProject({
          _id: "",
          title: "",
          areaHectares: 0,
          targetTrees: 0,
          description: "",
          landImages: [],
        });
      }
    };
    fetchProject();
  }, [projectId]);

  // Load Google Maps only after project is available
  useEffect(() => {
    if (project && project.location && !mapLoaded) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCpzV2uci8gLyp8si2idL0Gy1PLUe_J8bU`;
      script.async = true;
      script.onload = () => initMap();
      document.body.appendChild(script);
      setMapLoaded(true);
    }
  }, [project, mapLoaded]);

  const initMap = () => {
    if (!project || !project.location) return;

    const [lng, lat] = project.location.coordinates;

    mapRef.current = new google.maps.Map(document.getElementById("map") as HTMLElement, {
      center: { lat, lng },
      zoom: 15,
    });

    // Add marker
    new google.maps.Marker({
      position: { lat, lng },
      map: mapRef.current,
      title: project.title,
    });

    // Optional: Draw a circle representing green cover if available
    if (autoGreenCover !== null) {
      new google.maps.Circle({
        strokeColor: "#00FF00",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#00FF00",
        fillOpacity: Math.min(autoGreenCover / 100, 1),
        map: mapRef.current,
        center: { lat, lng },
        radius: Math.sqrt(project.areaHectares * 10000 / Math.PI),
      });
    }

    // Auto analyze green cover from satellite image
    const proxyUrl = "https://gmap-sih-img-proxy.vipulchaturvedi.workers.dev/";
    const imgUrl = `${proxyUrl}?center=${lat},${lng}&zoom=15&size=640x640&key=YOUR_API_KEY`;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgUrl;
    img.onload = () => analyzeImgData(img, setAutoGreenCover, setAutoIdleLand);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setUploadedFile(e.target.files[0]);
  };

  const analyzeImage = () => {
    if (uploadedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => analyzeImgData(img, setUploadedGreenCover, setUploadedIdleLand);
      };
      reader.readAsDataURL(uploadedFile);
      return;
    }
    toast({ title: 'No image selected', description: 'Please select an image to analyze.' });
  };

  const analyzeImgData = (
    img: HTMLImageElement,
    setGreen: (val: number) => void,
    setIdle: (val: number) => void
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let greenPixels = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 1] > 100) greenPixels++;
    }

    const totalPixels = canvas.width * canvas.height;
    const greenPercent = Number(((greenPixels / totalPixels) * 100).toFixed(2));
    const idlePercent = Number((100 - greenPercent).toFixed(2));

    setGreen(greenPercent);
    setIdle(idlePercent);
  };

  const saveAnalysis = async () => {
    if (!project || uploadedGreenCover === null || uploadedIdleLand === null) return;
    try {
      await fetch(`http://localhost:4000/api/v1/gov/projects/${project._id}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          greenCover: uploadedGreenCover,
          idleLand: uploadedIdleLand,
        }),
      });
      toast({ title: 'Saved', description: 'Uploaded analysis saved successfully!' });
      navigate("/government");
    } catch (err) {
      console.error(err);
      toast({ title: 'Save failed', description: 'Failed to save analysis.' });
    }
  };

  if (!project) return <div>Loading project...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">{project.title}</h1>
      <p className="my-2">{project.description}</p>
      <p>
        Area: {project.areaHectares} hectares | Target Trees: {project.targetTrees}
      </p>
      <p>
        Location: {project.location?.coordinates?.[1] ?? "N/A"}, {project.location?.coordinates?.[0] ?? "N/A"}
      </p>

      <div className="flex flex-wrap gap-4 my-4">
        {project.landImages && project.landImages.length > 0 ? (
          project.landImages.map((img, idx) => (
            <img
              key={idx}
              src={img.startsWith("http") ? img : `http://localhost:4000/${img}`}
              alt={`Project ${idx + 1}`}
              className="w-1/2 rounded shadow"
            />
          ))
        ) : (
          <p>No images uploaded for this project.</p>
        )}
      </div>

      <div id="map" style={{ height: "500px", width: "90%", margin: "20px auto", border: "1px solid #ccc" }} />

      {/* Auto analysis display */}
      {autoGreenCover !== null && autoIdleLand !== null && (
        <div className="my-4 p-4 bg-green-100 rounded">
          <h2 className="font-bold">🌐 Auto Analysis (from Map)</h2>
          <p>🌳 Green Cover: {autoGreenCover}%</p>
          <p>🏜️ Idle Land: {autoIdleLand}%</p>
        </div>
      )}

      {/* Uploaded image analysis */}
      <div className="my-4">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button
          onClick={analyzeImage}
          className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Analyze Green Cover
        </button>
      </div>

      {uploadedGreenCover !== null && uploadedIdleLand !== null && (
        <div className="my-4 p-4 bg-green-200 rounded">
          <h2 className="font-bold">📤 Uploaded Image Analysis</h2>
          <p>🌳 Green Cover: {uploadedGreenCover}%</p>
          <p>🏜️ Idle Land: {uploadedIdleLand}%</p>
          <button
            onClick={saveAnalysis}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Uploaded Analysis
          </button>
        </div>
      )}
    </div>
  );
}
