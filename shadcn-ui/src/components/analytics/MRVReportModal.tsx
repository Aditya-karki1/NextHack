import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload } from 'lucide-react';
import axios from 'axios';

interface MRVReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  ngoRegistrationId: string;
  onSuccess: (record: any) => void;
  onSubmitting?: () => void;
}

export default function MRVReportModal({
  open,
  onOpenChange,
  projectId,
  ngoRegistrationId,
  onSuccess,
  onSubmitting,
}: MRVReportModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    treesPlanted: '',
    survivalRate: '',
    carbonSequestered: '',
    notes: '',
  });
  const [images, setImages] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    setLoading(true);
    if (onSubmitting) onSubmitting();
    try {
      const data = new FormData();
      // Server expects: projectId, userId, treeCount, dateReported, etc. Images key is 'droneImages'
      data.append('projectId', projectId);
      data.append('userId', ngoRegistrationId);
      data.append('treeCount', formData.treesPlanted);
      data.append('survivalRate', formData.survivalRate);
      data.append('carbonSequestered', formData.carbonSequestered);
      data.append('notes', formData.notes);
      data.append('dateReported', new Date().toISOString());

      images.forEach((image) => {
        data.append('droneImages', image);
      });

      const response = await axios.post(
        'http://localhost:4000/api/v1/mrv/submit',
        data,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: 'Success',
          description: 'MRV report submitted successfully!',
        });
        onSuccess(response.data.record);
        onOpenChange(false);
        setFormData({
          treesPlanted: '',
          survivalRate: '',
          carbonSequestered: '',
          notes: '',
        });
        setImages([]);
      }
    } catch (error: any) {
      console.error(error);
      const message = error?.response?.data?.message || error?.message || 'Failed to submit report';
      toast({ title: 'Error', description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-subtle border-0 shadow-elegant">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Submit MRV Report</DialogTitle>
          <DialogDescription>
            Upload verification data and images for project monitoring
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="treesPlanted">Trees Planted</Label>
              <Input
                id="treesPlanted"
                type="number"
                value={formData.treesPlanted}
                onChange={(e) => setFormData({ ...formData, treesPlanted: e.target.value })}
                placeholder="e.g., 150"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="survivalRate">Survival Rate (%)</Label>
              <Input
                id="survivalRate"
                type="number"
                value={formData.survivalRate}
                onChange={(e) => setFormData({ ...formData, survivalRate: e.target.value })}
                placeholder="e.g., 85"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="carbonSequestered">Carbon Sequestered (tCO₂)</Label>
            <Input
              id="carbonSequestered"
              type="number"
              step="0.01"
              value={formData.carbonSequestered}
              onChange={(e) => setFormData({ ...formData, carbonSequestered: e.target.value })}
              placeholder="e.g., 12.5"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="images">Upload Images</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImages(Array.from(e.target.files || []))}
                className="hidden"
              />
              <label htmlFor="images" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Images
                  </span>
                </Button>
              </label>
              <p className="text-sm text-muted-foreground mt-2">
                Upload photos of planted trees and project progress
              </p>
            </div>
            {images.length > 0 && (
              <p className="text-sm text-success">
                {images.length} image(s) selected
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional observations or notes about the project..."
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}