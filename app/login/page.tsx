import {
  LoginLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            ResumeForge
          </CardTitle>
          <CardDescription>
            AI-powered resume editor with version control.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LoginLink className="w-full">
            <Button className="w-full cursor-pointer">Login</Button>
          </LoginLink>
          <RegisterLink className="w-full">
            <Button variant="outline" className="w-full cursor-pointer">
              Sign up
            </Button>
          </RegisterLink>
        </CardContent>
      </Card>
    </div>
  );
}
