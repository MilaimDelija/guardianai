import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
      <SignIn />
    </div>
  );
}
