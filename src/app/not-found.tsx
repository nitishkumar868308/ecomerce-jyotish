import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-primary)] px-4">
      <h1 className="text-8xl font-bold text-[var(--accent-primary)]">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">
        Page Not Found
      </h2>
      <p className="mt-2 text-[var(--text-muted)] text-center max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 px-6 py-3 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:bg-[var(--accent-primary-hover)] transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
