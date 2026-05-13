import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "MIT PARADH | Student Portal",
  description: "Advanced institutional student dashboard.",
};

import AppWrapper from "@/components/AppWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}

