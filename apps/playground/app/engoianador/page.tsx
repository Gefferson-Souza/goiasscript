import { loadSiteConfig } from '@/config/load-site-config.ts';
import { EngoianadorScreen } from './engoianador-screen.tsx';

export default function EngoianadorPage() {
  return <EngoianadorScreen engoianadorUrl={loadSiteConfig().engoianadorUrl} />;
}
