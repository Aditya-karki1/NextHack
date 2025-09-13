import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Eye, MapPin, ArrowLeft, Bot, Camera, Zap } from 'lucide-react';
import type { Task } from '@/lib/mockData';

interface AIVerificationProps {
  task: Task;
  onApprove: () => void;
  onReject: () => void;
  onBack: () => void;
}

export default function AIVerification({ task, onApprove, onReject, onBack }: AIVerificationProps) {
  const [verificationStep, setVerificationStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Mock AI analysis results
  const aiResults = {
    treesDetected: task.treeCount - 15, // Slightly less than planned
    healthScore: 92,
    geoVerification: 98,
    speciesAccuracy: 89,
    overallScore: 91,
    carbonCreditsEligible: Math.floor(task.treeCount * 0.75),
    confidence: 94
  };

  const mockImages = [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1574263867128-a3d5c1b1decc?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=300&h=200&fit=crop'
  ];

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate AI processing time
    setTimeout(() => {
      setVerificationStep(1);
      setIsAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">AI Verification System</h1>
            <p className="text-gray-600">Automated verification of plantation evidence</p>
          </div>
        </div>
        <Badge className="bg-blue-100 text-blue-700">
          <Bot className="w-3 h-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      {/* Project Overview */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Project Under Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold text-lg">{task.title}</h3>
              <div className="flex items-center text-gray-600 mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {task.location}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Trees Planned:</span>
                <span className="font-semibold">{task.treeCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Species:</span>
                <span className="font-semibold">{task.species.join(', ')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Completed by:</span>
                <span className="font-semibold">{task.assignedTo}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-semibold">{task.completedDate}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {verificationStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evidence Submitted</CardTitle>
            <CardDescription>Review the evidence before starting AI analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Uploaded Images */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <Camera className="w-4 h-4 mr-2" />
                Geo-tagged Images ({mockImages.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={img} 
                      alt={`Evidence ${index + 1}`} 
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      GPS ✓
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Report */}
            <div>
              <h4 className="font-semibold mb-3">Project Report</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  "Successfully completed the plantation of {task.treeCount} trees in the designated area. 
                  All saplings were planted according to the specified guidelines with proper spacing and care. 
                  The team ensured proper soil preparation and initial watering. GPS coordinates have been 
                  verified for each planting zone. Expected survival rate is above 90% based on soil conditions 
                  and weather patterns."
                </p>
              </div>
            </div>

            {!isAnalyzing ? (
              <Button 
                onClick={handleStartAnalysis}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start AI Analysis
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="font-semibold">AI Analysis in Progress...</p>
                  <p className="text-sm text-gray-600">Processing images and verifying plantation data</p>
                </div>
                <Progress value={66} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {verificationStep === 1 && (
        <div className="space-y-6">
          {/* AI Analysis Results */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                AI Analysis Complete
              </CardTitle>
              <CardDescription>
                Automated verification results with {aiResults.confidence}% confidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Trees Detected:</span>
                      <span className="font-semibold">{aiResults.treesDetected}/{task.treeCount}</span>
                    </div>
                    <Progress value={(aiResults.treesDetected / task.treeCount) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Health Score:</span>
                      <span className="font-semibold">{aiResults.healthScore}%</span>
                    </div>
                    <Progress value={aiResults.healthScore} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Geo Verification:</span>
                      <span className="font-semibold">{aiResults.geoVerification}%</span>
                    </div>
                    <Progress value={aiResults.geoVerification} className="h-2" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Species Accuracy:</span>
                      <span className="font-semibold">{aiResults.speciesAccuracy}%</span>
                    </div>
                    <Progress value={aiResults.speciesAccuracy} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Overall Score:</span>
                      <span className="font-semibold text-green-600">{aiResults.overallScore}%</span>
                    </div>
                    <Progress value={aiResults.overallScore} className="h-2" />
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="font-semibold text-green-700">Recommended Action:</p>
                    <p className="text-sm text-green-600">
                      APPROVE - Project meets verification standards
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <Tabs defaultValue="detection" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="detection">Tree Detection</TabsTrigger>
              <TabsTrigger value="health">Health Analysis</TabsTrigger>
              <TabsTrigger value="blockchain">Blockchain Report</TabsTrigger>
            </TabsList>

            <TabsContent value="detection">
              <Card>
                <CardHeader>
                  <CardTitle>Computer Vision Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mockImages.map((img, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={img} 
                          alt={`Analysis ${index + 1}`} 
                          className="w-full h-32 object-cover rounded-lg border-2 border-green-400"
                        />
                        <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                          <div className="bg-white px-2 py-1 rounded text-xs font-semibold">
                            {Math.floor(Math.random() * 50) + 100} trees
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">AI Detection Summary:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Total trees detected: {aiResults.treesDetected}</li>
                      <li>• Detection accuracy: 96.2%</li>
                      <li>• Healthy specimens: {Math.floor(aiResults.treesDetected * 0.92)}</li>
                      <li>• Proper spacing verified: Yes</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health">
              <Card>
                <CardHeader>
                  <CardTitle>Tree Health Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">92%</div>
                        <div className="text-sm text-gray-600">Healthy Trees</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">6%</div>
                        <div className="text-sm text-gray-600">Stressed</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">2%</div>
                        <div className="text-sm text-gray-600">At Risk</div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Health Analysis Details:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Leaf color analysis: Normal chlorophyll levels detected</li>
                        <li>• Growth pattern: Consistent with species expectations</li>
                        <li>• Soil moisture: Adequate hydration levels</li>
                        <li>• Pest detection: No significant pest activity observed</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blockchain">
              <Card>
                <CardHeader>
                  <CardTitle>Blockchain Integration Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Carbon Credit Calculation:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Trees Successfully Planted:</span>
                          <span>{aiResults.treesDetected}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carbon Sequestration Rate:</span>
                          <span>0.75 tonnes CO₂/tree/year</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <span>Total Carbon Credits Eligible:</span>
                          <span>{aiResults.carbonCreditsEligible} tonnes CO₂</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Smart Contract Ready:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Project verification: ✓ Completed</li>
                        <li>• GPS validation: ✓ Verified</li>
                        <li>• Image authentication: ✓ Passed</li>
                        <li>• Credit calculation: ✓ Ready for minting</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex space-x-4 justify-center">
            <Button 
              onClick={onApprove}
              className="bg-green-600 hover:bg-green-700 px-8"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Approve & Mint Credits
            </Button>
            <Button 
              onClick={onReject}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 px-8"
              size="lg"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Reject Verification
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}