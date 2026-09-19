import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm border-b pb-2">
        <Link href="/admin" className="font-medium">
          Orders
        </Link>
        <Link href="/admin/products">Products</Link>
        <Link href="/admin/categories">Categories</Link>
      </div>
      {children}
    </div>
  );
}
