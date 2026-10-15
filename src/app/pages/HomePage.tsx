import { FeaturedPlugins } from '../components/FeaturedPlugins';
import { FeatureStories } from '../components/FeatureStories';
import { Hero } from '../components/Hero';

export function HomePage() {
  return (
    <>
      <Hero />
      <FeatureStories />
      <FeaturedPlugins />
    </>
  );
}

