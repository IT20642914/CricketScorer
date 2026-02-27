"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      router.push("/");
    }
  }, [session, router]);

  const error = searchParams.get("error");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Cricket Scorer</h1>
          <p className="text-gray-600 text-center mb-8">
            Sign in to your account to continue
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-semibold">Error: {error}</p>
              <p className="text-sm">Please check your credentials and try again.</p>
            </div>
          )}

          <Button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full mb-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <image href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMjMuNDczIDExLjExNDJjMC0uODIwNy0uMDcxNC0xLjYwOTgtLjE5ODItMi4zNjk4SDEydjQuNDc5Mkg5LjE5MWMtLjEwNzctLjY5NTItLjc5MjItMS42NzEtMS42NzY0LTIuNDQ1VjcuNzkyOGg0LjEyMTJDMTQuODk0IDYuOTE3NiAxNy45MDEgNS4zMDU1IDE4LjQ1IDMuMDc0NUgxOC40NzdWMy4wNzQ1Yy0xLjM0OTcgMS4wMDA4LTMuMDg4MiAxLjU5MTgtNC44NDcgMS43MDk3di4zMDMxYzAgMS41NjQgtLjM1IDE2LjMxMjgtLjM1IDE2LjMxMjgtMi4xMDM4IDAtMy4wODgyLS4yNzQtMy4wODgyLS4yNzRzLS40ODM2LS41NTctMS4xNjQ2LTEuMTUwOGMtMS45MzI3LTEuNzI3My0zLjA4ODItNS4yMDYtMy4wODgyLTkuMDMyIDAtMy44MjU2IDEuMTU1Ny03LjMwNDcgMy4wODgyLTkuMDMyMy43ODA2LS41OTMyIDEuMTY0Ni0xLjE1MDggMS4xNjQ2LTEuMTUwOHMuOTc1LTEuMDIxNCAzLjA4ODItMS4wMjE0djEuMDIxNGMwIC4xNTQuMDUgMS42NjIuMDUgMS42NjJoMi45Mjg4YzAtLjIxNi4wMzU3LTEuNTA0LjAzNTctMS41MDR2LTEuMDIxNGMxLjc2MjQuMTE3NiAzLjQ5OC42MjExIDQuODQ3IDEuNzA5NyIgZmlsbD0iIzQyODVGNCIvPjwvZz48L3N2Zz4=" width="24" height="24" />
            </svg>
            Sign in with Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or continue as</span>
            </div>
          </div>

          <div className="text-center text-gray-600 text-sm">
            <p>Use your Google account to sign in securely</p>
          </div>
        </div>
      </div>
    </div>
  );
}
