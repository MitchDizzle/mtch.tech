import MarkdownIt from 'markdown-it'
import matter from 'gray-matter'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

// Auto-discover all markdown files in content directory
const contentModules = import.meta.glob('@/content/**/*.md', {
  eager: true,
  query: '?raw',
})

export function useContent() {
  /**
   * Parse markdown file content
   */
  const parseContent = (rawContent, filePath) => {
    const { data: frontmatter, content } = matter(rawContent)

    // Extract category and slug from file path
    // Example: @/content/recipes/baking/cookies.md
    const pathParts = filePath.split('/')
    const fileName = pathParts[pathParts.length - 1].replace('.md', '')
    const slug = fileName

    // Determine category path
    let category = 'uncategorized'
    let subcategory = null

    if (pathParts.includes('recipes')) {
      category = 'recipes'
      const recipeIdx = pathParts.indexOf('recipes')
      if (pathParts[recipeIdx + 1] && pathParts[recipeIdx + 1] !== fileName + '.md') {
        subcategory = pathParts[recipeIdx + 1] // baking or cooking
      }
    } else if (pathParts.includes('portfolio')) {
      category = 'portfolio'
    } else if (pathParts.includes('blog')) {
      category = 'blog'
    }

    // Render markdown to HTML
    const html = md.render(content)

    return {
      ...frontmatter,
      slug,
      category: subcategory || category,
      html,
      _filePath: filePath,
    }
  }

  /**
   * Get all content parsed and ready
   */
  const getAllContent = () => {
    const allContent = []

    for (const [path, content] of Object.entries(contentModules)) {
      const parsed = parseContent(content, path)
      allContent.push(parsed)
    }

    return allContent
  }

  /**
   * Get content filtered by category
   */
  const getContentByCategory = async (category) => {
    const all = getAllContent()
    const filtered = all.filter((item) => {
      if (category === 'portfolio' || category === 'blog') {
        return item._filePath.includes(`/content/${category}/`)
      }
      // For recipes, we don't filter here as we want all recipes
      return item._filePath.includes(`/content/${category}/`)
    })

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0)
      const dateB = b.date ? new Date(b.date) : new Date(0)
      return dateB - dateA
    })
  }

  /**
   * Get all recipes (both baking and cooking)
   */
  const getRecipes = async () => {
    const all = getAllContent()
    const recipes = all.filter((item) => item._filePath.includes('/content/recipes/'))

    // Sort by date (newest first)
    return recipes.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0)
      const dateB = b.date ? new Date(b.date) : new Date(0)
      return dateB - dateA
    })
  }

  /**
   * Get single content by slug
   */
  const getContentBySlug = async (category, slug) => {
    const items = await getContentByCategory(category)
    return items.find((item) => item.slug === slug) || null
  }

  /**
   * Get single recipe by category and slug
   */
  const getRecipeBySlug = async (subcategory, slug) => {
    const recipes = await getRecipes()
    return recipes.find((item) => item.category === subcategory && item.slug === slug) || null
  }

  return {
    getAllContent,
    getContentByCategory,
    getRecipes,
    getContentBySlug,
    getRecipeBySlug,
  }
}
