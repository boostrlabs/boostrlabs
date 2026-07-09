import { serveJohankarrd } from '../../_lib/johankarrd-live-route.js';

const fallbackSite = {
  name: 'Café del Mar',
  slug: 'cafedelmar',
  bg: 'linear-gradient(142deg,#0a203d 0%,#2b4e72 57%,#a8b3b5 100%)',
  accent: '#feedb9',
  card: '#062040',
  sections: [
    { id: 'home', label: 'Home', items: [
      { type: 'logo', src: '/assets/johankarrd/cafedelmar/logofull.png' },
      { type: 'image', src: '/assets/johankarrd/cafedelmar/image04.jpg' },
      { type: 'image', src: '/assets/johankarrd/cafedelmar/image16.jpg' }
    ]},
    { id: 'menu', label: 'Menu', items: [
      { type: 'image', src: '/assets/johankarrd/cafedelmar/image06.jpg' },
      { type: 'image', src: '/assets/johankarrd/cafedelmar/image18.jpg' },
      { type: 'image', src: '/assets/johankarrd/cafedelmar/image09.jpg' }
    ]},
    { id: 'contact', label: 'Contacto', items: [
      { type: 'logo', src: '/assets/johankarrd/cafedelmar/logofull.png' },
      { type: 'links', links: [['MAIL','mailto:'],['INSTA','#'],['ORDER','#'],['TIKTOK','#']] }
    ]},
    { id: 'gallery', label: 'Gallery', items: [
      { type: 'gallery', imgs: ['/assets/johankarrd/cafedelmar/3299c2ea.jpg','/assets/johankarrd/cafedelmar/2791d0e1.jpg','/assets/johankarrd/cafedelmar/46493ee7.jpg','/assets/johankarrd/cafedelmar/image17.jpg'] }
    ]}
  ]
};

export const onRequest = (context) => serveJohankarrd(context, 'cafedelmar', fallbackSite);
