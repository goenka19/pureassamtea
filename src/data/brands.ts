export interface Brand {
  id: string;
  name: string;
  maker: string;
  logo: string;
  placeholder?: boolean;
}

export const BRANDS: Brand[] = [
  { id: 'lalkilla',      name: 'Lalkilla',      maker: 'Rhino Industries',         logo: '/images/brands/lalkilla.png' },
  { id: 'krisnachura',   name: 'Krisnachura',   maker: 'CTC · Wholesale',          logo: '/images/brands/krisnachura.jpeg' },
  { id: 'ratanpur',      name: 'Ratanpur',      maker: 'CTC · Wholesale',          logo: '/images/brands/ratanpur.png' },
  { id: 'bortemto',      name: 'Bortemto',      maker: 'Sainagar',                 logo: '/images/brands/bortemto.png' },
  { id: 'kakatibaree',   name: 'Kakatibaree',   maker: 'Ratanpur',                 logo: '/images/brands/kakatibaree.png' },
  { id: 'abhoyapur',     name: 'Abhoyapur',     maker: 'Garden Fresh Upper Assam', logo: '/images/brands/abhoyapur.png' },
  { id: 'lal-mohar',     name: 'Lal Mohar',     maker: 'Rhino Industries',         logo: '/images/brands/lal-mohar.png' },
  { id: 'parikhet',      name: 'Parikhet',      maker: 'Sainagar',                 logo: '/images/brands/parikhet.png' },
  { id: 'ujjal',         name: 'Ujjal',         maker: 'Sainagar',                 logo: '/images/brands/ujjal.png' },
];
