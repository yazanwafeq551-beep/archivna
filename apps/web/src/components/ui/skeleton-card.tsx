import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </CardFooter>
    </Card>
  );
}

export { SkeletonCard };
