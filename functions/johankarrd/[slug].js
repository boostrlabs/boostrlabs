import { serveJohankarrd } from '../_lib/johankarrd-live-route.js';

export const onRequest = (context) => {
  const slug = context.params.slug;
  const fallbackSite = {
    name: String(slug || 'Johankarrd'),
    slug: String(slug || 'johankarrd'),
    bg: 'radial-gradient(circle at 50% 0,rgba(255,255,255,.14),transparent 32%),#000',
    accent: '#fff',
    card: '#08080b',
    sections: [
      { id: 'home', label: 'Home', items: [{ type: 'title', text: String(slug || 'Johankarrd') }] }
    ]
  };
  return serveJohankarrd(context, slug, fallbackSite);
};
