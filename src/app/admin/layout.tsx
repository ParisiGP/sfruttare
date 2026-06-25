import { AdminHeader } from "@/components/layout/Header/AdminHeader/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminHeader />

      <main>
        {children}
      </main>
    </>
  );
}
