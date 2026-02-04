'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  {
    name: 'Home',
    href: '/',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
          d={active
            ? 'M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 01-.53 1.28h-1.19v7.44a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75V17a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v4.25a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-7.44H4.31a.75.75 0 01-.53-1.28l8.69-8.69z'
            : 'M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'
          }
        />
      </svg>
    ),
  },
  {
    name: 'Scan',
    href: '/scan',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
          d={active
            ? 'M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.802.024-1.644-.036l-.028-.002c-.528-.038-.95-.068-1.28-.053a1.923 1.923 0 00-.554.1C1.132 7.476.75 8.08.75 9v5.25a2.25 2.25 0 002.25 2.25h.894c.586 0 1.08.393 1.213.964l.493 2.119A.75.75 0 006.33 20h.473a.75.75 0 00.725-.563l.27-1.04a1.25 1.25 0 011.21-.939h6.985a1.25 1.25 0 011.21.938l.27 1.04a.75.75 0 00.726.564h.473a.75.75 0 00.73-.58l.493-2.12c.133-.57.627-.963 1.213-.963h.894a2.25 2.25 0 002.25-2.25V9c0-.92-.382-1.524-.93-1.761a1.92 1.92 0 00-.553-.1c-.331-.015-.753.015-1.28.053l-.029.002c-.842.06-1.263.09-1.644.036a2.31 2.31 0 01-1.64-1.055c-.207-.337-.293-.766-.434-1.622l-.007-.04c-.089-.54-.16-.97-.264-1.29a1.923 1.923 0 00-.334-.468C15.222 2.274 14.629 2 13.75 2h-3.5c-.879 0-1.472.274-1.858.755a1.92 1.92 0 00-.334.468c-.104.32-.175.75-.264 1.29l-.007.04c-.14.856-.227 1.285-.434 1.622zM15 11.25a3 3 0 11-6 0 3 3 0 016 0z'
            : 'M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.802.024-1.644-.036a9.124 9.124 0 00-.265-.02c-.57-.04-.996-.07-1.32-.053-.31.017-.474.065-.549.1C1.132 7.476.75 8.08.75 9v5.25a2.25 2.25 0 002.25 2.25h.894c.586 0 1.08.393 1.213.964l.493 2.119A.75.75 0 006.33 20h.473a.75.75 0 00.725-.563l.27-1.04a1.25 1.25 0 011.21-.939h6.985a1.25 1.25 0 011.21.938l.27 1.04a.75.75 0 00.726.564h.473a.75.75 0 00.73-.58l.493-2.12c.133-.57.627-.963 1.213-.963h.894a2.25 2.25 0 002.25-2.25V9c0-.92-.382-1.524-.93-1.761-.075-.035-.24-.083-.549-.1a11.497 11.497 0 00-1.32.053c-.842.06-1.263.09-1.644.036a2.31 2.31 0 01-1.64-1.055c-.207-.337-.293-.766-.434-1.622l-.007-.04c-.089-.54-.16-.97-.264-1.29a1.923 1.923 0 00-.334-.468C15.222 2.274 14.629 2 13.75 2h-3.5c-.879 0-1.472.274-1.858.755a1.92 1.92 0 00-.334.468c-.104.32-.175.75-.264 1.29l-.007.04c-.14.856-.227 1.285-.434 1.622zM15 13.5a3 3 0 11-6 0 3 3 0 016 0z'
          }
        />
      </svg>
    ),
  },
  {
    name: 'Tours',
    href: '/tours',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
          d={active
            ? 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25'
            : 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25'
          }
        />
      </svg>
    ),
  },
  {
    name: 'Favorites',
    href: '/favorites',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    ),
  },
  {
    name: 'Search',
    href: '/search',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5}
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide nav on artwork detail pages for immersive experience
  if (pathname.startsWith('/objects/')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-stone-200">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-[64px]
                transition-colors duration-200
                ${isActive
                  ? 'text-stone-900'
                  : 'text-stone-400 hover:text-stone-600'
                }`}
            >
              {tab.icon(isActive)}
              <span className={`text-[10px] font-medium ${isActive ? 'text-stone-900' : 'text-stone-400'}`}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
