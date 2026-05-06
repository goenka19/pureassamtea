export interface Brand {
  id: string;
  name: string;
  maker: string;
  logo: string;
}

export const BRANDS: Brand[] = [
  { id: 'lalkilla',          name: 'Lalkilla',          maker: 'Rhino Industries',         logo: '/images/brands/lalkilla.png' },
  { id: 'krisnachura',       name: 'Krisnachura',        maker: 'CTC · Wholesale',          logo: '/images/brands/krisnachura.jpeg' },
  { id: 'ratanpur',          name: 'Ratanpur',           maker: 'CTC · Wholesale',          logo: '/images/brands/ratanpur.png' },
  { id: 'ratanpur-premiere', name: 'Ratanpur Premiere',  maker: 'CTC · Premium',            logo: '/images/brands/ratanpur-premiere.png' },
  { id: 'golai-bari',        name: 'Golai-bari',         maker: 'CTC · Wholesale',          logo: '/images/brands/golai-bari.png' },
  { id: 'abhoyapur',         name: 'Abhoyapur',          maker: 'Garden Fresh Upper Assam', logo: '/images/brands/abhoyapur.png' },
  { id: 'dehing-patkai',     name: 'Dehing-patkai',      maker: 'CTC · Wholesale',          logo: '/images/brands/dehing-patkai.png' },
  { id: 'boro-golai',        name: 'Boro-golai',         maker: 'CTC · Wholesale',          logo: '/images/brands/boro-golai.png' },
];
