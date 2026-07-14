export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-brand-600 rounded-lg p-1.5 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 8L9 5L15 5L18 8L18 18L12 21L6 18Z" fill="white" fillOpacity="0.9" />
          <path d="M9 8L12 6.5L15 6.5L15 15L12 16.5L9 15Z" fill="white" fillOpacity="0.4" />
          <circle cx="18" cy="6" r="2" fill="#FFD43B" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-bold text-brand-950 tracking-tight">T-Shirt Central</span>
        <span className="text-[11px] font-semibold text-brand-500 tracking-wider">365</span>
      </div>
    </div>
  );
}
