import Image from "next";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="glass-card p-10 max-w-lg w-full flex flex-col items-center gap-6">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-brand-500">
          MeepleStation
        </h1>
        <p className="text-surface-300 text-lg max-w-md">
          The all-in-one tabletop companion app for tracking scores, timers, and game history.
        </p>
        
        <div className="flex gap-4 mt-4 w-full">
          <button className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-xl transition-colors">
            Login
          </button>
          <button className="flex-1 py-3 px-4 bg-surface-800 hover:bg-surface-700 text-surface-200 border border-surface-600 font-medium rounded-xl transition-colors">
            Play as Guest
          </button>
        </div>
      </div>
    </main>
  );
}
