import { FeaturedPlugins } from '../components/FeaturedPlugins';
import { FeatureStories } from '../components/FeatureStories';
import { Hero } from '../components/Hero';
import type { HomeContent } from '../lib/api';

export function HomePage({ content }: { content: HomeContent }) {
  return (
    <>
      <Hero content={content} />
      <FeaturedPlugins />
      <FeatureStories content={content} />
    </>
  );
}

