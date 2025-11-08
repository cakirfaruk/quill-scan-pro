import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ErrorLogsList() {
  const [selectedError, setSelectedError] = useState<any>(null);
  
  const { data: errors, isLoading } = useQuery({
    queryKey: ['admin-error-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('error_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const handleResolve = async (errorId: string) => {
    await supabase
      .from('error_logs')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', errorId);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <Info className="h-4 w-4 text-warning" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Hata Raporları</CardTitle>
          <CardDescription>
            Son {errors?.length} hata - {errors?.filter(e => !e.resolved).length} çözülmemiş
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seviye</TableHead>
                  <TableHead>Hata Mesajı</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors?.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(error.severity)}
                        <Badge variant={getSeverityColor(error.severity) as any}>
                          {error.severity}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {error.error_message}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {error.error_type}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(error.timestamp), 'dd MMM HH:mm')}
                    </TableCell>
                    <TableCell>
                      {error.resolved ? (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Çözüldü
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Açık</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedError(error)}
                        >
                          Detay
                        </Button>
                        {!error.resolved && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResolve(error.id)}
                          >
                            Çöz
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Hata Detayları</DialogTitle>
            <DialogDescription>
              {selectedError?.error_type} - {format(new Date(selectedError?.timestamp || Date.now()), 'dd MMMM yyyy HH:mm:ss')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] w-full">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Hata Mesajı</h4>
                <p className="text-sm text-muted-foreground">{selectedError?.error_message}</p>
              </div>
              
              {selectedError?.error_stack && (
                <div>
                  <h4 className="font-semibold mb-2">Stack Trace</h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                    {selectedError.error_stack}
                  </pre>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">URL</h4>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {selectedError?.url}
                </code>
              </div>

              <div>
                <h4 className="font-semibold mb-2">User Agent</h4>
                <p className="text-xs text-muted-foreground">{selectedError?.user_agent}</p>
              </div>

              {selectedError?.context && Object.keys(selectedError.context).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Context</h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedError.context, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
