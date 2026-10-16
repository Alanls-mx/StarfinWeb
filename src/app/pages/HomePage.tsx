import { FeaturedPlugins } from '../components/FeaturedPlugins';
import { FeatureStories } from '../components/FeatureStories';
import { Hero } from '../components/Hero';
import { defaultHomeContent } from '../lib/api';

export function HomePage() {
  return (
    <>
      <Hero content={defaultHomeContent} />
      <FeaturedPlugins />
      <FeatureStories content={defaultHomeContent} />
    </>
  );
}

