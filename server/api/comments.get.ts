export default defineEventHandler(async (event) => {
  const slug = getQuery(event).slug as string | undefined
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing slug' })
  }

  const { results } = await useDb(event).getComments(slug, 50)
  return results
})
