import { Hero } from '@/components/home/Hero';
import { CategoryMosaic, DeliveryCheck, Favorites, Ticker, WeekPromos } from '@/components/home/Sections';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Ticker />
      <WeekPromos />
      <Favorites />
      <CategoryMosaic />
      <DeliveryCheck />
    </>
  );
}
