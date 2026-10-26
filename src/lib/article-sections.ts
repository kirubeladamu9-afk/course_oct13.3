export const getArticleSectionTitles = (html: string) => {
  const titles = Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll('h2'))
    .map((heading) => heading.textContent?.replace(/\s+/g, ' ').trim() || 'Untitled section')
  return titles.length ? titles : ['Article']
}
