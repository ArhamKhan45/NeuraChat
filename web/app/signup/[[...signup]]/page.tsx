"use client";
import { SignUp } from "@clerk/nextjs";

const SignupScreen = () => {
  return (
    <>
      <div className="flex h-screen w-full items-center justify-center">
        <SignUp path="/signup" routing="path" signInUrl="/signin" />
      </div>
    </>
  );
};

export default SignupScreen;
