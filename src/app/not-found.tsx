import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-6xl font-bold text-gray-200">404</h1>
      <h2 className="text-xl font-semibold text-gray-800">Page not found</h2>
      <p className="text-gray-500 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
