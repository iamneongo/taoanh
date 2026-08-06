"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-500" />,
        info: <InfoIcon className="size-4 text-stone-500" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500" />,
        error: <OctagonXIcon className="size-4 text-red-500" />,
        loading: <Loader2Icon className="size-4 animate-spin text-stone-500" />,
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "var(--color-stone-800, #292524)",
          "--normal-border": "var(--color-stone-200, #e7e5e4)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-stone-200 !bg-white !text-stone-800 !shadow-lg !shadow-stone-900/5 !gap-2.5 !p-4 !font-sans",
          title: "!text-sm !font-medium !text-stone-900",
          description: "!text-xs !text-stone-500",
          actionButton: "!rounded-lg !bg-stone-900 !text-white !text-xs",
          cancelButton: "!rounded-lg !bg-stone-100 !text-stone-600 !text-xs",
          closeButton: "!border-stone-200 !text-stone-400 hover:!text-stone-700",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
