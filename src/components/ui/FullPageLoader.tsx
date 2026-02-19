"use client";

export default function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-app-bg">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-app-primarySoft border-t-app-button rounded-full animate-spin" />

        {/* Text */}
        <p className="text-app-headerText font-medium tracking-wide">
          Loading...
        </p>
      </div>
    </div>
  );
}
