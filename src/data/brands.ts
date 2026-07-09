export interface Brand {
  id: string;
  name: string;
  maker: string;
  logo: string;
}

export const BRANDS: Brand[] = [
  // Rhino Industries
  { id: 'lalkilla',      name: 'Lalkilla',      maker: 'Rhino Industries', logo: '/images/brands/lalkilla.png' },
  { id: 'lal-mohar',     name: 'Lal Mohar',     maker: 'Rhino Industries', logo: '/images/brands/lal-mohar.png' },
  { id: 'krisnachura',   name: 'Krisnachura',   maker: 'Rhino Industries', logo: '/images/brands/krisnachura.png' },
  // Sainagar
  { id: 'bortemto',      name: 'Bortemto',      maker: 'Sainagar',         logo: '/images/brands/bortemto.png' },
  { id: 'parikhet',      name: 'Parikhet',      maker: 'Sainagar',         logo: '/images/brands/parikhet.png' },
  { id: 'ujjal',         name: 'Ujjal',         maker: 'Sainagar',         logo: '/images/brands/ujjal.png' },
  // Ratanpur
  { id: 'ratanpur',      name: 'Ratanpur',      maker: 'Ratanpur',         logo: '/images/brands/ratanpur.png' },
  { id: 'kakatibaree',   name: 'Kakatibaree',   maker: 'Ratanpur',         logo: '/images/brands/kakatibaree.png' },
  { id: 'abhoyapur',     name: 'Abhoyapur',     maker: 'Ratanpur',         logo: '/images/brands/abhoyapur.png' },
];
