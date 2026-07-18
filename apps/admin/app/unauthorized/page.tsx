import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="bos-atmosphere flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-lg text-center" elevated>
        <CardHeader className="mb-6 items-center">
          <CardTitle className="text-2xl">Unauthorized</CardTitle>
          <CardDescription>
            Your account is authenticated but does not have admin access.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/login">
            <Button variant="secondary">Back to admin login</Button>
          </Link>
          <Link href="/auth/signout">
            <Button>Sign out</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
