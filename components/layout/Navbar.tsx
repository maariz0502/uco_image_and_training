import Link from "next/link"; 

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between bg-slate-900 p-4 text-white">
      <div className="text-xl font-bold tracking-wider">
        <Link href="/">title go here</Link>
      </div>

      <div className="flex gap-6">
        <Link href="/" className="hover:text-blue-400 transition-colors">
          Home
        </Link>
        <Link href="/dataset" className="hover:text-blue-400 transition-colors">
          Dataset
        </Link>
        <Link href="/annotation" className="hover:text-blue-400 transition-colors">
          Annotation
        </Link>
        <Link href="/training" className="hover:text-blue-400 transition-colors">
          Training
        </Link>
        <Link href="/admin" className="hover:text-blue-400 transition-colors">
          Admin Dashboard
        </Link>
      </div>
    </nav>
  );
}