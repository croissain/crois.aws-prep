import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "crois.aws-prep | AWS Exam Prep",
  description: "A calm, focused place to prepare for AWS certification exams."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
