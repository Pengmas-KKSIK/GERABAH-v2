// template.tsx dipasang ulang setiap pindah halaman, jadi animasi masuk diputar tiap kali menu dibuka.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
