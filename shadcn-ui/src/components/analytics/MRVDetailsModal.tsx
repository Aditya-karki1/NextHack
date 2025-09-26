import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  report: any | null;
};

export default function MRVDetailsModal({ open, onOpenChange, report }: Props) {
  if (!report) return null;

  const images: string[] = Array.isArray(report.droneImages) ? report.droneImages : (report.droneImages ? [report.droneImages] : []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">MRV Report Details</DialogTitle>
          <DialogDescription>View submitted evidence and report metadata</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-md font-medium">Project: {report.projectTitle || report.projectId || 'Unknown'}</h3>
              <p className="text-sm text-muted-foreground">Reported on: {new Date(report.dateReported || report.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={report.status === 'Verified' ? 'bg-success text-black' : report.status === 'Rejected' ? 'bg-destructive text-white' : 'bg-warning-light text-warning'}>
                {report.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tree Count</p>
              <p className="font-semibold">{report.treeCount}</p>

              {report.notes && (
                <>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap">{report.notes}</p>
                </>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Drone Images</p>
              <div className="grid grid-cols-2 gap-2">
                {images.length === 0 && <p className="text-sm text-muted-foreground">No images submitted.</p>}
                {images.map((src, idx) => (
                  <a key={idx} href={src} target="_blank" rel="noreferrer" className="block rounded overflow-hidden">
                    <img src={src} alt={`drone-${idx}`} className="w-full h-36 object-cover" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
