"use client";
import HeaderBar from "@/components/home/HeaderBar";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#18132a]">
      <div className="max-w-6xl mx-auto px-4 pt-10">
        <HeaderBar />
      </div>
      <div className="max-w-6xl mx-auto px-4 pb-10">
        {children}
      </div>
    </div>
  );
}
