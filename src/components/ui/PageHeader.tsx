
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
    title: string;
    description?: string;
    showBack?: boolean;
    action?: React.ReactNode;
}

export const PageHeader = ({ title, description, showBack = false, action }: PageHeaderProps) => {
    const navigate = useNavigate();

    return (
        <div className="relative z-10 flex flex-col gap-1 pb-6 pt-2 px-1">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {showBack && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                    )}

                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                </div>

                {action && (
                    <div>{action}</div>
                )}
            </div>
        </div>
    );
};
