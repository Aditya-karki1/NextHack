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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-slate-900 rounded-lg shadow-lg p-6">
        <DialogHeader>
          <DialogTitle>Submit MRV Report</DialogTitle>
          <DialogDescription>Provide MRV details for the selected project. Project ID is auto-filled.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-3 py-2" onSubmit={(e) => handleSubmit(e)}>
          <div>
            <Label>Project ID</Label>
            <Input value={projectId ?? ''} readOnly />
          </div>

          <div>
            <Label>Date Reported</Label>
            <Input type="date" value={dateReported} onChange={(e) => setDateReported(e.target.value)} />
          </div>

          <div>
            <Label>Tree Count</Label>
            <Input type="number" value={treeCount === '' ? '' : String(treeCount)} onChange={(e) => setTreeCount(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>

          <div>
            <Label>Drone Images</Label>
            <Input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
          </div>

          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">completed</SelectItem>
                <SelectItem value="incompleted">incompleted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Report'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}