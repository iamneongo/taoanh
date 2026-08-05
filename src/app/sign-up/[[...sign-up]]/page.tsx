import { SignUp } from "@clerk/nextjs";
import { Sofa } from "lucide-react";

const appearance = {
  variables: {
    colorPrimary: "#1c1917",
    colorBackground: "#ffffff",
    colorForeground: "#1c1917",
    colorMutedForeground: "#78716c",
    colorNeutral: "#1c1917",
    colorInput: "#fafaf9",
    colorInputForeground: "#1c1917",
    colorBorder: "#e7e5e4",
    fontFamily: "inherit",
    borderRadius: "0.75rem",
  },
  elements: {
    card: "shadow-none border border-stone-200 rounded-2xl",
    headerTitle: "text-base font-semibold text-stone-900",
    headerSubtitle: "text-sm text-stone-500",
    socialButtonsBlockButton: "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 rounded-xl text-sm font-medium",
    dividerLine: "bg-stone-100",
    dividerText: "text-stone-400 text-xs",
    formFieldLabel: "text-xs font-medium text-stone-600 uppercase tracking-wide",
    formFieldInput: "border border-stone-200 rounded-lg text-sm",
    formButtonPrimary: "bg-stone-900 hover:bg-stone-700 text-white text-sm font-medium rounded-lg shadow-none",
    footerActionLink: "text-stone-700 hover:text-stone-900 font-medium",
    formFieldErrorText: "text-red-500 text-xs",
    otpCodeFieldInput: "border border-stone-200 rounded-lg",
  },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-4">
      <div className="flex items-center gap-2 mb-8">
        <Sofa className="size-5 text-stone-700" />
        <span className="font-semibold text-stone-900 tracking-tight text-lg">VisioNT</span>
      </div>
      <SignUp appearance={appearance} />
    </div>
  );
}
