import { serveJohankarrd } from '../../_lib/johankarrd-live-route.js';

const fallbackSite = {
  name: 'SOLVE Inventory',
  slug: 'solveinventory',
  bg: '#000',
  accent: '#fff',
  card: '#000',
  sections: [
    { id: 'MORE', label: 'Home', items: [
      { type: 'logo', src: '/assets/johankarrd/solveinventory/inventory.jpg' },
      { type: 'grid', tiles: [
        ['Toyota','/assets/johankarrd/solveinventory/supra.png','/assets/johankarrd/solveinventory/toyota.jpg','#toyota'],
        ['Honda','/assets/johankarrd/solveinventory/typer.png','/assets/johankarrd/solveinventory/honda.jpg','#honda'],
        ['CDJR','/assets/johankarrd/solveinventory/challengersrt.png','/assets/johankarrd/solveinventory/cdjr.jpg','#cdjr'],
        ['Hyundai','/assets/johankarrd/solveinventory/elantra.png','/assets/johankarrd/solveinventory/hyundai.jpg','#hyundai']
      ]}
    ]},
    { id: 'toyota', label: 'Toyota', items: [
      { type: 'logo', src: '/assets/johankarrd/solveinventory/toyota.jpg' },
      { type: 'image', src: '/assets/johankarrd/solveinventory/supra.png', link: 'https://www.toyotaofhollywood.com/' }
    ]},
    { id: 'honda', label: 'Honda', items: [
      { type: 'logo', src: '/assets/johankarrd/solveinventory/honda.jpg' },
      { type: 'image', src: '/assets/johankarrd/solveinventory/typer.png', link: 'https://www.hondaofaventura.com/searchused.aspx' }
    ]},
    { id: 'cdjr', label: 'CDJR', items: [
      { type: 'logo', src: '/assets/johankarrd/solveinventory/cdjr.jpg' },
      { type: 'image', src: '/assets/johankarrd/solveinventory/challengersrt.png', link: 'https://www.brickellchryslerdodgejeepram.com/' }
    ]},
    { id: 'hyundai', label: 'Hyundai', items: [
      { type: 'logo', src: '/assets/johankarrd/solveinventory/hyundai.jpg' },
      { type: 'image', src: '/assets/johankarrd/solveinventory/elantra.png', link: 'https://www.rickcasehyundaidavie.com' }
    ]}
  ]
};

export const onRequest = (context) => serveJohankarrd(context, 'solveinventory', fallbackSite);
