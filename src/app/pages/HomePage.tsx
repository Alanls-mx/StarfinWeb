import { FeaturedPlugins } from '../components/FeaturedPlugins';
import { FeatureStories } from '../components/FeatureStories';
import { Hero } from '../components/Hero';
import { useEffect, useState } from 'react';
import { defaultHomeContent, getPublicSettings, type HomeContent } from '../lib/api';

export function HomePage() {
  const [content, setContent] = useState<HomeContent>(defaultHomeContent);
  useEffect(() => {
    let active = true;
    getPublicSettings().then(settings => {
      if (active && settings.homeContent) setContent({ ...defaultHomeContent, ...settings.homeContent });
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  return (
    <>
      <Hero content={content} />
      <FeatureStories content={content} />
      <FeaturedPlugins />
    </>
  );
}

