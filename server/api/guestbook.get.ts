export default defineEventHandler(async (event) => {
  const db = useDb(event)
  const { results } = await db.getMessages(50)
  return results
})
