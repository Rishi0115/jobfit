"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-4xl font-bold text-gray-800">Something went wrong</h1>
      <p className="text-gray-500 max-w-sm">
        An unexpected error occurred. Please try again.
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre className="text-xs text-left bg-red-50 border border-red-200 rounded p-4 max-w-lg overflow-auto">
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        className="mt-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
