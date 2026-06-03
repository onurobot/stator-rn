import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/tools',     label: 'Tools' },
  { href: '/alerts',    label: 'Alerts' },
  { href: '/reports',   label: 'Reports' },
  { href: '/settings',  label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-muted/40 flex flex-col p-4 gap-1">
        <div className="font-bold text-lg mb-6 px-2">AI Tracker</div>
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className="px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors">
            {item.label}
          </Link>
        ))}
        <div className="mt-auto pt-4">
          <UserButton />
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
