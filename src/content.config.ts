import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const entry = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  slug: z.string().regex(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/),
  published: z.boolean().default(false),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.discriminatedUnion('kind', [
    entry.extend({
      kind: z.literal('person'),
      person: z.string().min(1),
    }),
    entry.extend({
      kind: z.literal('story'),
      people: z.array(z.string()).default([]),
    }),
    entry.extend({
      kind: z.literal('recipe'),
      people: z.array(z.string()).default([]),
    }),
  ]),
});

export const collections = { pages };
