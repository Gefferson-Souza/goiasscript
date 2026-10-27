import Link from 'next/link';
import { ErrorScreen } from '@/components/ErrorScreen';
import { ERROR_COPY } from '@/lib/error-pages.constants';

export default function NotFoundPage() {
  const { title, message, homeLabel } = ERROR_COPY.notFound;
  return (
    <ErrorScreen title={title} message={message}>
      <Link href="/" className="rounded bg-goias-green px-4 py-2 font-semibold text-white hover:bg-goias-green/80">
        {homeLabel}
      </Link>
    </ErrorScreen>
  );
}
