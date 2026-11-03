import Link from 'next/link';
import { HeroCode } from '@/components/landing/HeroCode';
import { HOME_TEXTS } from '@/components/landing/home-texts.constants';
import { LegacyShareRedirect } from '@/components/landing/LegacyShareRedirect';
import { PRIMER_ROUTE, ENGOIANADOR_ROUTE, PLAYGROUND_ROUTE } from '@/lib/landing/routes.constants';

const PATH_ROUTES = { playground: PLAYGROUND_ROUTE, primer: PRIMER_ROUTE, engoianador: ENGOIANADOR_ROUTE } as const;

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-16">
      <LegacyShareRedirect />
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">{HOME_TEXTS.title}</h1>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-dim">{HOME_TEXTS.lead}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={PLAYGROUND_ROUTE} className="rounded bg-pequi px-5 py-2.5 font-semibold text-plane hover:bg-pequi/85">
              {HOME_TEXTS.openPlayground}
            </Link>
            <Link href={PRIMER_ROUTE} className="rounded px-1 py-2 text-ink underline decoration-caret underline-offset-4 hover:text-caret">
              {HOME_TEXTS.openPrimer}
            </Link>
          </div>
        </div>
        <HeroCode />
      </section>

      <section aria-labelledby="por-onde-comecar" className="mt-16 border-t border-line pt-10">
        <h2 id="por-onde-comecar" className="text-xl font-bold tracking-tight text-ink">{HOME_TEXTS.pathsTitle}</h2>
        <ul className="mt-6 grid gap-8 sm:grid-cols-3">
          {HOME_TEXTS.paths.map((path) => (
            <li key={path.route}>
              <Link href={PATH_ROUTES[path.route]} className="rounded font-semibold text-ink underline decoration-caret underline-offset-4 hover:text-caret">
                {path.title}
              </Link>
              <p className="mt-2 text-dim">{path.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
