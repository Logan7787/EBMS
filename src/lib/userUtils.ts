export function getDisplayName(user: any, language: string) {
  if (!user) return ''
  if (language === 'ta' && user.name_ta) {
    return user.name_ta
  }
  return user.name
}
