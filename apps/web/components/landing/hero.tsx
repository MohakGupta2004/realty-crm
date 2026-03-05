import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="py-28 text-center">
      <h1 className="text-6xl font-bold tracking-tight">Open Source CRM</h1>

      <p className="mt-6 text-muted-foreground max-w-xl mx-auto">
        Build relationships with your customers using a modern open-source CRM
        platform.
      </p>

      <div className="flex justify-center gap-4 mt-8">
        <Link href="/auth/signup">
          <Button size="lg">Start for free</Button>
        </Link>
        <Button size="lg" variant="outline">
          View GitHub
        </Button>
      </div>
    </section>
  );
}
