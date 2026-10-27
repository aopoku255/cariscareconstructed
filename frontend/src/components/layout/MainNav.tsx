'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ExternalLink, Mail, Menu, Phone, X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { MenuNode } from '@/types/api';

interface Props {
  items: MenuNode[];
  utility: MenuNode[];
  contact: { phone?: string | null; phoneLink?: string | null; email?: string | null };
}

const isActive = (pathname: string, href: string) => {
  if (/^https?:/.test(href)) return false;
  const path = href.split('?')[0];
  return path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);
};

function NavLink({ item, className, onNavigate }: { item: MenuNode; className: string; onNavigate?: () => void }) {
  const newTab = item.open_in_new_tab || item.external;
  if (item.external || newTab) {
    return (
      <a href={item.href} className={className} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined} onClick={onNavigate}>
        {item.label}
        {item.external && <ExternalLink aria-hidden className="ml-1.5 inline size-3.5 opacity-70" />}
        {newTab && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

/**
 * Main navigation using the disclosure pattern: top-level items with children are buttons that
 * toggle a panel (click, Enter/Space, or hover on pointer devices); Escape closes and returns focus.
 */
export function MainNav({ items, utility, contact }: Props) {
  const pathname = usePathname();
  // Open state remembers the page it was opened on, so navigating closes menus without an effect.
  const [openFor, setOpenFor] = useState<{ index: number; path: string } | null>(null);
  const [mobileOpenOn, setMobileOpenOn] = useState<string | null>(null);
  const openIndex = openFor?.path === pathname ? openFor.index : null;
  const mobileOpen = mobileOpenOn === pathname;
  const setOpenIndex = useCallback((i: number | null) => setOpenFor(i === null ? null : { index: i, path: pathname }), [pathname]);
  const setMobileOpen = useCallback((v: boolean) => setMobileOpenOn(v ? pathname : null), [pathname]);
  const [mobileExpanded, setMobileExpanded] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const close = useCallback(() => setOpenFor(null), []);

  // Close desktop dropdowns when clicking outside or pressing Escape.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (openIndex !== null) {
        buttonRefs.current[openIndex]?.focus();
        close();
      }
      setMobileOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [openIndex, close, setMobileOpen]);

  // Prevent background scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // The drawer stays mounted, so move focus in on open and back to the Menu button on close.
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mobileOpen) closeButtonRef.current?.focus();
    else if (drawerRef.current?.contains(document.activeElement)) menuButtonRef.current?.focus();
  }, [mobileOpen]);

  // A click right after hover-opening should not immediately close the panel.
  const openedByHover = useRef(false);
  const hoverOpen = (i: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (openIndex !== i) openedByHover.current = true;
    setOpenIndex(i);
  };
  const clickToggle = (i: number) => {
    if (openIndex === i && openedByHover.current) {
      openedByHover.current = false;
      return;
    }
    openedByHover.current = false;
    setOpenIndex(openIndex === i ? null : i);
  };
  const hoverClose = () => {
    closeTimer.current = setTimeout(close, 150);
  };

  return (
    <nav ref={navRef} aria-label="Main" className="bg-brand-800 text-white shadow-[0_2px_0_rgb(52_203_247)]">
      <div className="container-site">
        {/* Desktop */}
        <ul className="hidden items-stretch lg:flex">
          {items.map((item, i) => {
            const active = isActive(pathname, item.href) || item.children.some((c) => isActive(pathname, c.href));
            const base = `flex h-13 items-center gap-1 px-3.5 font-display text-[0.95rem] font-semibold tracking-wide transition-colors xl:px-4 ${
              active ? 'bg-brand-900 text-white shadow-[inset_0_-3px_0_var(--color-sky-accent)]' : 'text-brand-50 hover:bg-brand-900 hover:text-white'
            }`;
            if (!item.children.length) {
              return (
                <li key={item.id} className="flex">
                  <NavLink item={item} className={base} />
                </li>
              );
            }
            const open = openIndex === i;
            const mega = Boolean(item.description) && item.children.length > 3;
            return (
              <li key={item.id} className="relative flex" onMouseEnter={() => hoverOpen(i)} onMouseLeave={hoverClose}>
                <button
                  ref={(el) => {
                    buttonRefs.current[i] = el;
                  }}
                  type="button"
                  className={base}
                  aria-expanded={open}
                  aria-controls={`${id}-panel-${i}`}
                  onClick={() => clickToggle(i)}
                >
                  {item.label}
                  <ChevronDown aria-hidden className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                <div
                  id={`${id}-panel-${i}`}
                  hidden={!open}
                  className={`absolute top-full left-0 z-50 border-t-2 border-sky-accent bg-white text-body shadow-(--shadow-raised) ${mega ? 'w-[40rem]' : 'w-72'}`}
                >
                  <div className={mega ? 'grid grid-cols-[14rem_1fr]' : ''}>
                    {mega && (
                      <div className="bg-brand-50 p-6">
                        <p className="font-display text-lg font-bold text-brand-900">{item.label}</p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                        <Link href={item.href} className="mt-4 inline-block text-sm font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-700">
                          Go to {item.label}
                        </Link>
                      </div>
                    )}
                    <ul className={`p-2 ${mega ? 'grid grid-cols-1 content-start py-4' : ''}`}>
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <NavLink
                            item={child}
                            onNavigate={close}
                            className={`block rounded px-4 py-2.5 text-[0.95rem] hover:bg-brand-50 hover:text-brand-800 ${
                              isActive(pathname, child.href) ? 'font-semibold text-brand-800' : 'text-body'
                            }`}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Mobile bar */}
        <div className="flex h-12 items-center justify-between lg:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            className="flex h-9 items-center gap-2 rounded-full px-3.5 font-display font-semibold transition-colors hover:bg-white/10 active:bg-white/15"
            aria-expanded={mobileOpen}
            aria-controls={`${id}-drawer`}
            onClick={() => setMobileOpen(true)}
          >
            <Menu aria-hidden className="size-5" />
            Menu
          </button>
        </div>
      </div>

      {/* Mobile drawer: stays mounted so it can slide in and out; inert while closed. */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? 'visible' : 'invisible delay-300'} transition-[visibility] motion-reduce:delay-0`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        id={`${id}-drawer`}
        inert={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-brand-950/50 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
        <div
          ref={drawerRef}
          className={`absolute inset-y-0 right-0 flex w-[calc(100%-2.5rem)] max-w-sm flex-col overflow-y-auto overscroll-contain rounded-l-2xl bg-white text-body shadow-[-12px_0_40px_rgb(10_41_97/0.18)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between bg-white/95 px-5 backdrop-blur">
            <span className="font-display text-lg font-bold text-brand-900">Menu</span>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex size-10 items-center justify-center rounded-full bg-surface text-brand-800 transition-colors hover:bg-brand-50 active:bg-brand-100"
              aria-label="Close menu"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <ul className="flex-1 space-y-1 px-3 pb-4">
            {items.map((item, i) => {
              const active = isActive(pathname, item.href) || item.children.some((c) => isActive(pathname, c.href));
              const expanded = mobileExpanded === i;
              const row = `flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left font-display text-[1.05rem] font-semibold transition-colors ${
                active ? 'bg-brand-50 text-brand-800' : 'text-ink hover:bg-surface active:bg-surface'
              }`;
              return (
                <li key={item.id}>
                  {item.children.length ? (
                    <>
                      <button type="button" className={row} aria-expanded={expanded} aria-controls={`${id}-m-${i}`} onClick={() => setMobileExpanded(expanded ? null : i)}>
                        {item.label}
                        <span className={`flex size-7 items-center justify-center rounded-full transition-colors ${expanded ? 'bg-brand-700 text-white' : 'bg-surface text-brand-600'}`}>
                          <ChevronDown aria-hidden className={`size-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                        </span>
                      </button>
                      {/* Animates height by transitioning the grid row from 0fr to 1fr. */}
                      <div
                        id={`${id}-m-${i}`}
                        inert={!expanded}
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                      >
                        <ul className="overflow-hidden">
                          <li aria-hidden className="h-1" />
                          {item.children.map((child) => (
                            <li key={child.id}>
                              <NavLink
                                item={child}
                                onNavigate={() => setMobileOpen(false)}
                                className={`ml-4 block rounded-lg border-l-2 py-2.5 pr-4 pl-4 text-[0.95rem] transition-colors ${
                                  isActive(pathname, child.href) ? 'border-brand-700 bg-brand-50/60 font-semibold text-brand-800' : 'border-line text-body hover:border-brand-300 hover:bg-surface'
                                }`}
                              />
                            </li>
                          ))}
                          <li aria-hidden className="h-2" />
                        </ul>
                      </div>
                    </>
                  ) : (
                    <NavLink item={item} onNavigate={() => setMobileOpen(false)} className={row} />
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mx-3 mb-3 space-y-3 rounded-2xl bg-surface p-5 text-sm">
            {utility.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {utility.map((u) => (
                  <NavLink key={u.id} item={u} onNavigate={() => setMobileOpen(false)} className="inline-flex items-center rounded-full bg-white px-3.5 py-1.5 font-semibold text-brand-700 shadow-(--shadow-card)" />
                ))}
              </div>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phoneLink ?? contact.phone}`} className="flex items-center gap-2.5 text-body hover:text-brand-700">
                <Phone aria-hidden className="size-4 text-brand-600" /> {contact.phone}
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 break-all text-body hover:text-brand-700">
                <Mail aria-hidden className="size-4 text-brand-600" /> {contact.email}
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
