export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-surface-950">
      <div className="glass-card p-8 md:p-10 max-w-md w-full flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
}
