import { FileText, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export function DashboardEmptyState() {
    const navigate = useNavigate();

    return (
        <Card className="border-2 border-dashed border-muted/50 bg-muted/5">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">No transactions found</h3>
                <p className="max-w-sm text-muted-foreground mt-2 mb-6">
                    Upload your bank statement to start visualizing your financial data.
                </p>
                <Button onClick={() => navigate('/statements')} className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Upload Statement
                </Button>
            </CardContent>
        </Card>
    );
}
