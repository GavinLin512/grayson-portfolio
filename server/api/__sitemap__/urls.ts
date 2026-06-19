export default defineSitemapEventHandler(async (event) => {
  const [posts, projects] = await Promise.all([
    queryCollection(event, 'blog').all(),
    queryCollection(event, 'projects').all(),
  ])
  return [
    // blog frontmatter has no image fields → loc + lastmod only
    ...posts.map(p => ({ loc: p.path, lastmod: p.date })),
    // projects expose cover + screens → emit as image sitemap entries
    ...projects.map(p => ({
      loc: p.path,
      lastmod: p.date,
      images: [p.cover, ...(p.screens ?? [])]
        .filter(Boolean)
        .map(loc => ({ loc })),
    })),
  ]
})
