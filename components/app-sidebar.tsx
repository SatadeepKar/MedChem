'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { FlaskConical, LayoutDashboard, Package, Tag, ShoppingCart, ClipboardList, LogOut, ChevronRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface SidebarProps {
  role: 'admin' | 'seller'
  userName: string
  userEmail: string
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Products', href: '/admin/products', icon: <Package className="w-4 h-4" /> },
  { label: 'Categories', href: '/admin/categories', icon: <Tag className="w-4 h-4" /> },
  { label: 'Orders', href: '/admin/orders', icon: <ClipboardList className="w-4 h-4" /> },
]

const sellerNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Catalogue', href: '/dashboard/products', icon: <Package className="w-4 h-4" /> },
  { label: 'Cart', href: '/dashboard/cart', icon: <ShoppingCart className="w-4 h-4" /> },
  { label: 'My Orders', href: '/dashboard/orders', icon: <ClipboardList className="w-4 h-4" /> },
]

export function AppSidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const nav = role === 'admin' ? adminNav : sellerNav

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-60 bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="p-2 rounded-xl bg-primary/15 border border-primary/20">
          <FlaskConical className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-sm tracking-tight">AASA MedChem</p>
          <p className="text-xs text-muted-foreground capitalize">{role} panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
              isActive(item.href)
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <span className={cn('transition-colors', isActive(item.href) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}>
              {item.icon}
            </span>
            {item.label}
            {isActive(item.href) && <ChevronRight className="w-3 h-3 ml-auto text-primary/60" />}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 space-y-2 border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sidebar-accent/50">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
