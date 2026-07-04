export interface Brand {
  id: string;
  name: string;
  maker: string;
  logo: string;
  placeholder?: boolean;
}

export const BRANDS: Brand[] = [
  { id: 'lalkilla',          name: 'Lalkilla',          maker: 'Rhino Industries',         logo: '/images/brands/lalkilla.png' },
  { id: 'krisnachura',       name: 'Krisnachura',        maker: 'CTC · Wholesale',          logo: '/images/brands/krisnachura.jpeg' },
  { id: 'ratanpur',          name: 'Ratanpur',           maker: 'CTC · Wholesale',          logo: '/images/brands/ratanpur.png' },
  { id: 'placeholder-4',     name: 'Coming Soon',        maker: '—',                        logo: '', placeholder: true },
  { id: 'placeholder-5',     name: 'Coming Soon',        maker: '—',                        logo: '', placeholder: true },
  { id: 'abhoyapur',         name: 'Abhoyapur',          maker: 'Garden Fresh Upper Assam', logo: '/images/brands/abhoyapur.png' },
  { id: 'placeholder-7',     name: 'Coming Soon',        maker: '—',                        logo: '', placeholder: true },
  { id: 'placeholder-8',     name: 'Coming Soon',        maker: '—',                        logo: '', placeholder: true },
];
