import "./globals.css";
import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center">
        <main className="text-center space-y-2 p-6">
          <h1 className="text-2xl font-semibold">404</h1>
          <p>Page not found.</p>
          <Link href="/" className="underline">
            Back to home
          </Link>
        </main>
      </body>
    </html>
  );
}
