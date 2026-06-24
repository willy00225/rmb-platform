export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bkg">
      <div className="animate-pulse">
        <img
          src="/images/logo-rmb.png"
          alt="RMB Logo"
          className="h-20 w-auto mx-auto"
        />
      </div>
      <div className="mt-6 flex gap-2">
        <div className="h-3 w-3 rounded-full bg-primary animate-bounce [animation-delay:0ms]"></div>
        <div className="h-3 w-3 rounded-full bg-primary animate-bounce [animation-delay:150ms]"></div>
        <div className="h-3 w-3 rounded-full bg-primary animate-bounce [animation-delay:300ms]"></div>
      </div>
    </div>
  );
}