import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <div className="space-y-6 max-w-2xl">
        <h1 className="heading-xl gradient-text">404</h1>
        <h2 className="heading-lg">Page Not Found</h2>
        
        <p className="text-lg text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="mt-8">
          <Link 
            href="/" 
            className="btn-primary inline-flex items-center gap-2"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}