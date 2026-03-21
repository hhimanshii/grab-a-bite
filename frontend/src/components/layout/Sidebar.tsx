import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

export type SidebarLink = {
  title: string
  href: string
  icon: React.ReactNode
}

interface SidebarProps {
  links: SidebarLink[]
  className?: string
}

export function Sidebar({ links, className }: SidebarProps) {
  const { pathname } = useLocation()

  return (
    <nav className={cn("flex flex-col gap-2 w-64 border-r bg-muted/40 p-4 h-[calc(100vh-4rem)]", className)}>
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            to={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
              isActive ? "bg-muted text-primary" : "text-muted-foreground"
            )}
          >
            {link.icon}
            {link.title}
          </Link>
        )
      })}
    </nav>
  )
}
