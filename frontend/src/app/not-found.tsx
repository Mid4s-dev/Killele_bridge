import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-muted/30 px-4 text-center">
      <Image src="/logo.png" alt="Kilele Bridge" width={120} height={34} />
      <div className="space-y-3">
        <p className="font-display text-7xl font-bold text-brand-500">404</p>
        <h1 className="font-display text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link href="/home">
        <Button variant="outline" size="lg" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Button>
      </Link>
    </div>
  );
}
