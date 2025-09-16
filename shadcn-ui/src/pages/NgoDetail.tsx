// pages/NgoDetail.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";

export default function NgoDetail() {
  const { ngoId } = useParams<{ ngoId: string }>();
  const [ngo, setNgo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNgo = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/v1/ngo/${ngoId}`, { credentials: "include" });
        const data = await res.json();
        setNgo(data.ngo);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNgo();
  }, [ngoId]);

  const handleVerify = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/ngo/${ngoId}/verify`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
  setNgo(data.ngo);
  toast({ title: 'Verified', description: 'KYC Status updated to VERIFIED' });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading NGO...</div>;
  if (!ngo) return <div>NGO not found</div>;

  return (
    <div className="p-6">
      <Card className="mb-4">
        <CardHeader><CardTitle>NGO Details</CardTitle></CardHeader>
        <CardContent>
          <p><strong>Name:</strong> {ngo.name}</p>
          <p><strong>Email:</strong> {ngo.email}</p>
          <p><strong>KYC Status:</strong> {ngo.kycStatus}</p>
          <Button onClick={handleVerify} className="mt-2 bg-green-600 hover:bg-green-700">
            Verify KYC
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Organization Details</CardTitle></CardHeader>
        <CardContent>
          <p><strong>Name:</strong> {ngo.organization?.name || "N/A"}</p>
          <p><strong>Type:</strong> {ngo.organization?.type || "N/A"}</p>
          <p><strong>Address:</strong> {ngo.organization?.address || "N/A"}</p>
          <p><strong>Contact:</strong> {ngo.organization?.contact?.phone || "N/A"} | {ngo.organization?.contact?.email || "N/A"}</p>
          <p><strong>Documents:</strong></p>
          <ul>
            {ngo.organization?.documents?.length
              ? ngo.organization.documents.map((doc: any) => (
                  <li key={doc.cid}>{doc.filename}</li>
                ))
              : "No documents uploaded"}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
