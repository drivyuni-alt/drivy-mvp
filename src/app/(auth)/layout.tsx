import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
      <Link href="/" className="flex w-fit items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-bold text-ink-900">
          D
        </span>
        <span className="text-lg font-semibold">Drivy</span>
      </Link>
      <div className="mt-10 flex-1">{children}</div>
    </main>
  );
}
