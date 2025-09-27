import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import axios from 'axios';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  ngoRegistrationId: string;
  onSuccess?: (record: any) => void;
};

export default function MRVReportModal({ open, onOpenChange, projectId, ngoRegistrationId, onSuccess }: Props) {
  const { toast } = useToast();
  console.log("MRVReportModal ngoRegistrationId:", ngoRegistrationId);
  console.log("MRVReportModal projectId:", projectId);
  const [dateReported, setDateReported] = useState<string>(new Date().toISOString().slice(0,10));
  const [treeCount, setTreeCount] = useState<number | ''>('');
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'completed' | 'incompleted'>('completed');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!projectId) {
      toast({ title: 'Missing project', description: 'Missing project reference' });
      return;
    }
    if (treeCount === '' || Number(treeCount) <= 0) {
      toast({ title: 'Invalid input', description: 'Enter a valid tree count' });
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('projectId', projectId);
      form.append('userId', ngoRegistrationId);
      form.append('dateReported', dateReported);
      form.append('treeCount', String(treeCount));
      // send as 'Pending' to let verifier validate later; adjust if you want
      form.append('status', status === 'completed' ? 'Pending' : 'Pending');

      files.forEach((f) => form.append('droneImages', f));

      const res = await axios.post('http://localhost:4000/api/v1/mrv/submit', form, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 201 || res.status === 200) {
        toast({ title: 'Submitted', description: 'MRV report submitted' });
        onOpenChange(false);
        onSuccess?.(res.data);
      } else {
        toast({ title: 'Submission failed', description: 'Failed to submit MRV: ' + res.status + ' ' + res.statusText });
      }
    } catch (err: any) {
      console.error('Submit MRV error', err);
  const serverMessage = err?.response?.data?.message || err?.response?.data || err?.message;
  toast({ title: 'Submission failed', description: 'Failed to submit MRV: ' + (serverMessage || 'Unknown error') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Custom overlay backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
      )}
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border-0 bg-white p-0 shadow-2xl duration-200 rounded-xl">
          <div className="bg-white rounded-xl p-6 max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Submit MRV Report</DialogTitle>
              <DialogDescription className="text-gray-600">Upload verification data and images for project monitoring</DialogDescription>
            </DialogHeader>

            <form className="grid gap-4 py-2" onSubmit={(e) => handleSubmit(e)}>
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-gray-700">Project ID</Label>
                <Input 
                  value={projectId ?? ''} 
                  readOnly 
                  className="bg-gray-50 border-gray-200 text-gray-600"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium text-gray-700">Date Reported</Label>
                <Input 
                  type="date" 
                  value={dateReported} 
                  onChange={(e) => setDateReported(e.target.value)}
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium text-gray-700">Trees Planted</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 150"
                  value={treeCount === '' ? '' : String(treeCount)} 
                  onChange={(e) => setTreeCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium text-gray-700">Carbon Sequestered (CO₂)</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 12.5"
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium text-gray-700">Upload Images</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
                  <div className="space-y-2">
                    <div className="mx-auto h-12 w-12 text-gray-400 text-2xl">
                      📷
                    </div>
                    <div className="text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                        Choose Images
                        <Input 
                          id="file-upload"
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">Upload photos of planted trees and project progress</p>
                    {files.length > 0 && (
                      <p className="text-sm text-emerald-600 font-medium">{files.length} file(s) selected</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium text-gray-700">Additional Notes</Label>
                <textarea
                  placeholder="Any additional observations or notes about the project..."
                  className="min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="incompleted">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm" 
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}