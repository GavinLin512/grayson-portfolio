import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    projects: defineCollection({
      type: 'page',
      source: 'projects/**/*.md',
      schema: z.object({
        title: z.string(),
        subtitle: z.string(),
        year: z.number(),
        role: z.string(),
        team: z.string(),
        stack: z.array(z.string()),
        cover: z.string(),
        screens: z.array(z.string()),
        date: z.string(),
        category: z.enum(['product', 'system', 'side', 'identity']),
      }),
    }),
    skills: defineCollection({
      type: 'data',
      source: 'skills.yml',
      schema: z.object({
        backend:  z.array(z.string()),
        frontend: z.array(z.string()),
        devops:   z.array(z.string()),
        database: z.array(z.string()),
      }),
    }),
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string(),
        date: z.string(),
        tags: z.array(z.string()),
        pinned: z.boolean().optional().default(false),
        description: z.string().optional(),
      }),
    }),
  },
})
