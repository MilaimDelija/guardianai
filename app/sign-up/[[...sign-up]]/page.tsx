import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
      <SignUp />
    </div>
  );
}
