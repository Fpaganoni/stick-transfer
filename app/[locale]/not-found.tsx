import Link from "next/link";

export default function LocaleNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-2xl font-semibold">404</h1>
      <p>Page not found.</p>
      <Link href="/" className="underline">
        Back to home
      </Link>
    </main>
  );
}
