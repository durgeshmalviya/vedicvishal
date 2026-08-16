"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BiCalendar, BiCompass, BiLogoBlogger, BiSun } from "react-icons/bi";
import { HiSparkles, HiX } from "react-icons/hi";
import { PiNumberCircleNine } from "react-icons/pi";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/kundli", label: "Kundli & Astro", icon: HiSparkles },
  { href: "/horoscope", label: "Horoscope", icon: BiSun },
  { href: "/panchang", label: "Panchang", icon: BiCalendar },
  { href: "/planetpositions", label: "Transits & Events", icon: BiCompass },
  { href: "/numerology", label: "Numerology", icon: PiNumberCircleNine },
  { href: "/blog", label: "Blog", icon: BiLogoBlogger },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Throttled scroll handler (much better than raw listener)
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    onScroll(); // initial check
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu + lock body scroll
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isActiveHref = useCallback(
    (href: string) =>
      pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)),
    [pathname]
  );

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((v) => !v);
  }, []);

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${scrolled
            ? "bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-sm border-b border-zinc-200/80 dark:border-zinc-800/80 py-3"
            : "bg-[#e9dfcd] border-b border-transparent py-4"
          }
          ${isMenuOpen ? "!bg-[#e9dfcd] shadow-none" : ""}
        `}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" prefetch>
            <div className="relative h-8 w-8 md:h-9 md:w-9 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/60 animate-[spin_8s_linear_infinite]" />
              <div className="absolute inset-[3px] rounded-full border border-amber-400/40 animate-[spin_12s_linear_infinite_reverse]" />
              <div className="relative flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                <span className="text-white text-xs md:text-sm">☀</span>
              </div>
            </div>

            <div className="inline-flex flex-col items-center md:items-start">
              <h2 className="text-2xl font-black leading-tight">
                <span className="bg-gradient-to-r from-[#8C4A22] via-[#C57A2A] to-[#E2A63A] bg-clip-text text-transparent transition-all duration-300 group-hover:brightness-110">
                  Vedic Kundli
                </span>
                <span className="mx-2 text-stone-400">&</span>
                <span className="bg-gradient-to-r from-[#4B3B6B] via-[#6A4FB3] to-[#8B5CF6] bg-clip-text text-transparent transition-all duration-300 group-hover:brightness-110">
                  Vedic Numerology
                </span>
              </h2>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = isActiveHref(href);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  aria-current={isActive ? "page" : undefined}
                  className={`
                    group inline-flex items-center gap-2 px-3 py-2 rounded-lg
                    whitespace-nowrap transition-all duration-200
                    ${isActive
                      ? "bg-amber-500/10 text-amber-600 font-semibold dark:bg-amber-500/20 dark:text-amber-400"
                      : "text-zinc-700 hover:text-amber-600 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:text-amber-400 dark:hover:bg-white/10"
                    }
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
                  `}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-zinc-500 group-hover:text-amber-600 dark:text-zinc-400 dark:group-hover:text-amber-400"
                    }`}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden relative z-50 w-8 h-8 flex items-center justify-center"
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <HiX className="w-6 h-6 text-zinc-900" />
            ) : (
              <div className="w-6 h-4 flex flex-col justify-between">
                <span className="w-full h-[1.5px] bg-zinc-900" />
                <span className="w-full h-[1.5px] bg-zinc-900" />
                <span className="w-full h-[1.5px] bg-zinc-900" />
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <div
        className={`
          fixed inset-0 z-40 md:hidden bg-[#e9dfcd] flex flex-col items-center justify-center
          transition-all duration-300 ease-out
          ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}
        `}
      >
        <nav className="text-center space-y-7">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = isActiveHref(href);
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-center gap-3 text-2xl font-light tracking-wide transition-colors duration-200 ${
                  isActive ? "text-amber-600 font-medium" : "text-zinc-800 hover:text-amber-600"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}