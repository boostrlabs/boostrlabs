window.LIVE_ESTIMATOR_CONFIG = {
  assetVersion: '20260725-2',
  optimisticDiscount: 3000,
  standardDiscount: 2000,
  programEnd: '2026-08-03',
  specialApr: {
    standard: [6.34, 7.34, 11.99, 16.99],
    corolla: [6.99, 7.99, 8.79, 8.79],
    camry: [6.99, 7.99, 8.79, 8.79],
    prius: [1.99, 2.99, 3.99, 4.99],
    rav4: [6.99, 7.99, 8.79, 8.79],
    '4runner': [6.99, 7.99, 8.79, 8.79],
    tacoma: [5.99, 6.99, 7.99, 8.79],
    tundra: [3.99, 4.99, 5.99, 6.99],
    bz: [0, 0.99, 1.99, 2.99]
  }
};

window.TOYOTA_MODELS = [
  { id:'corolla', name:'Corolla', type:'Sedán', msrp:25700, aprProgram:'corolla', imageScale:1.2 },
  { id:'gr-corolla', name:'GR Corolla', type:'Hatchback deportivo', msrp:39920 },
  { id:'camry', name:'Camry Hybrid', type:'Sedán híbrido', msrp:32900, aprProgram:'camry', imageScale:1.08 },
  { id:'crown', name:'Crown', type:'Sedán híbrido AWD', msrp:41440, imageScale:1.24 },
  { id:'prius', name:'Prius PHEV', type:'Híbrido plug-in', msrp:35900, aprProgram:'prius' },
  { id:'corolla-cross', name:'Corolla Cross', type:'SUV', msrp:25400 },
  { id:'rav4', name:'RAV4 Hybrid', type:'SUV híbrido', msrp:34200, aprProgram:'rav4', asset:'rav4.jpg' },
  { id:'highlander', name:'Highlander', type:'SUV 3 filas', msrp:40500 },
  { id:'grand-highlander', name:'Grand Highlander', type:'SUV 3 filas', msrp:44800 },
  { id:'4runner', name:'4Runner', type:'SUV', msrp:45400, aprProgram:'4runner' },
  { id:'sienna', name:'Sienna', type:'Minivan híbrida', msrp:39400 },
  { id:'tacoma', name:'Tacoma', type:'Pickup', msrp:39350, aprProgram:'tacoma', imageScale:1.38 },
  { id:'tundra', name:'Tundra', type:'Pickup', msrp:41500, aprProgram:'tundra', asset:'tundra.jpg' },
  { id:'sequoia', name:'Sequoia', type:'SUV grande', msrp:64000 },
  { id:'gr86', name:'GR86', type:'Deportivo', msrp:31000, imageScale:1.18 },
  { id:'supra', name:'GR Supra', type:'Deportivo', msrp:57000 },
  { id:'bz', name:'bZ', type:'Eléctrico', msrp:37100, aprProgram:'bz' }
];

window.CREDIT_TIERS = [
  { id:'excellent', label:'720+', programTier:0, downRate:0, downMinimum:0, headline:'$0 DOWN POSIBLE' },
  { id:'good', label:'660–719', programTier:1, downRate:0.02, downMinimum:999, headline:'ENTRADA DESDE $999' },
  { id:'fair', label:'600–659', programTier:2, downRate:0.05, downMinimum:1999, headline:'ENTRADA DESDE $1,999' },
  { id:'challenged', label:'Menos de 600', programTier:3, downRate:0.10, downMinimum:3999, headline:'TENEMOS OPCIONES' }
];
