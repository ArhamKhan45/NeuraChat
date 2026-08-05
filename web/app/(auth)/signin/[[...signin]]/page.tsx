"use client";
import { SignIn } from "@clerk/nextjs";
import React from "react";

const SigninScreen = () => {
  return (
    <div className="flex justify-center items-center w-full h-screen">
      <SignIn path="/signin" routing="path" signUpUrl="/signup" />
    </div>
  );
};

export default SigninScreen;
