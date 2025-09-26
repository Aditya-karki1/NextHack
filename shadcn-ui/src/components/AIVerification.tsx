import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Eye, MapPin, ArrowLeft, Bot, Camera, Zap } from "lucide-react";
import * as ort from "onnxruntime-web";
import type { Task } from "@/lib/mockData";

interface AIVerificationProps {
  task: Task;
  onApprove: () => void;
  onReject: () => void;
  onBack: () => void;
}

export default function AIVerification({ task, onApprove, onReject, onBack }: AIVerificationProps) {
  const [verificationStep, setVerificationStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [detectedTrees, setDetectedTrees] = useState<number[]>([]);
  const [model, setModel] = useState<ort.InferenceSession | null>(null);

  // Load YOLOv8 model on mount
  useEffect(() => {
    async function loadModel() {
      const session = await ort.InferenceSession.create("https://ml-cdn.vipulchaturvedi.com/100going1000.onnx");
      setModel(session);
      console.log("YOLOv8 model loaded!");
    }
    loadModel();
  }, []);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const urls = files.map(file => URL.createObjectURL(file));
      setImages(urls);
    }
  };

  // Process images with YOLO
  const runDetection = async () => {
    if (!model || images.length === 0) return;

    setIsAnalyzing(true);
    let counts: number[] = [];

    for (const imgUrl of images) {
      const [input] = await prepareInput(imgUrl);
      const tensor = new ort.Tensor(Float32Array.from(input), [1, 3, 640, 640]);
      const output = await model.run({ images: tensor });
      const data = output["output0"].data as Float32Array;
      const boxes = processOutput(data, 640, 640); // width, height
      counts.push(boxes.length);
    }

    setDetectedTrees(counts);
    setIsAnalyzing(false);
    setVerificationStep(1);
  };

  // Convert image to model input
  async function prepareInput(url: string): Promise<[number[]]> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 640; canvas.height = 640;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, 640, 640);
        const data = ctx.getImageData(0, 0, 640, 640).data;

        const red = [], green = [], blue = [];
        for (let i = 0; i < data.length; i += 4) {
          red.push(data[i] / 255.0);
          green.push(data[i + 1] / 255.0);
          blue.push(data[i + 2] / 255.0);
        }
        resolve([[...red, ...green, ...blue]]);
      };
    });
  }

  // Process YOLO output -> bounding boxes
  function processOutput(output: Float32Array, imgW: number, imgH: number) {
    let boxes: [number, number, number, number, string, number][] = [];
    for (let i = 0; i < 8400; i++) {
      const [classId, prob] = [...Array(80).keys()]
        .map(c => [c, output[8400 * (c + 4) + i]])
        .reduce((a, b) => b[1] > a[1] ? b : a, [0, 0]);

      if (prob < 0.5) continue; // confidence filter
      const xc = output[i];
      const yc = output[8400 + i];
      const w = output[2 * 8400 + i];
      const h = output[3 * 8400 + i];
      const x1 = (xc - w / 2) / 640 * imgW;
      const y1 = (yc - h / 2) / 640 * imgH;
      const x2 = (xc + w / 2) / 640 * imgW;
      const y2 = (yc + h / 2) / 640 * imgH;

      boxes.push([x1, y1, x2, y2, "tree", prob]);
    }
    return boxes;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <h1 className="text-2xl font-bold">AI Verification System</h1>
        <Badge className="bg-blue-100 text-blue-700"><Bot className="w-3 h-3 mr-1" /> AI Powered</Badge>
      </div>

      {/* Image Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Geo-Tagged Images</CardTitle>
        </CardHeader>
        <CardContent>
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} />
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {images.map((img, i) => (
                <img key={i} src={img} className="w-full h-32 object-cover rounded-lg border" />
              ))}
            </div>
          )}
          {!isAnalyzing ? (
            <Button onClick={runDetection} className="w-full mt-4 bg-blue-600 hover:bg-blue-700" size="lg">
              <Zap className="w-5 h-5 mr-2" /> Start AI Analysis
            </Button>
          ) : (
            <div className="text-center mt-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="font-semibold">Analyzing images...</p>
              <Progress value={66} className="w-full mt-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Results */}
      {verificationStep === 1 && (
        <Card className="border-green-200 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle className="w-5 h-5 mr-2" /> AI Analysis Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Total Trees Detected: {detectedTrees.reduce((a, b) => a + b, 0)}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} className="w-full h-32 object-cover rounded-lg border-green-400 border-2" />
                  <div className="absolute bottom-2 left-2 bg-white px-2 py-1 text-xs rounded">
                    {detectedTrees[i]} trees
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve / Reject Buttons */}
      {verificationStep === 1 && (
        <div className="flex space-x-4 justify-center mt-6">
          <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700 px-8" size="lg">
            <CheckCircle className="w-5 h-5 mr-2" /> Approve & Mint Credits
          </Button>
          <Button onClick={onReject} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 px-8" size="lg">
            <XCircle className="w-5 h-5 mr-2" /> Reject Verification
          </Button>
        </div>
      )}
    </div>
  );
}
