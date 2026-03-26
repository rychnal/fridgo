import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Registrace" };

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl mb-4 shadow-sm">
            <span className="text-2xl font-black text-white">F</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">fridgo</h1>
          <p className="text-muted-foreground text-sm mt-1">Vaše virtuální lednice</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-5">Vytvoření účtu</h2>
          <SignupForm />
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Již máte účet?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Přihlaste se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
