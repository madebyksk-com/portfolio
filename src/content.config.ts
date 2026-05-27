import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const works = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/works' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    year: z.number().int(),
    medium: z.string().default('Oil on canvas'),
    image: image(),
    alt: z.string(),
    order: z.number().int().default(999),
    dimensions: z.string().optional(),
    location: z.string().optional(),
  }),
});

export const collections = { works };
