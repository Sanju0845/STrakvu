import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] text-[#e6edf3] p-4 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#161b22] border border-[#30363d] text-emerald-400 font-mono text-xl font-bold mb-4">
        404
      </div>
      <h2 className="text-xl font-semibold mb-2 font-mono text-white">Page Not Found</h2>
      <p className="text-sm text-[#8b949e] mb-6 max-w-md font-sans">
        The requested activity calendar page or resource does not exist.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs transition-colors"
      >
        Return to Activity Calendar
      </Link>
    </div>
  );
}
