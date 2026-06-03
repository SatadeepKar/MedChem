import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Unauthenticated users → login
  if (!session?.user) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Authenticated but not admin trying to access /admin
  if (pathname.startsWith('/admin') && session.user.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect admin from /dashboard to /admin
  if (pathname === '/dashboard' && session.user.role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Redirect logged-in user away from login page
  if (pathname === '/login' && session?.user) {
    const dest = session.user.role === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login'],
}
