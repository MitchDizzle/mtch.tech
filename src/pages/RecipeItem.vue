<template>
  <DefaultLayout>
    <div class="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div v-if="loading" class="text-center py-20">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>

        <div v-else-if="!content" class="text-center py-20">
          <p class="text-dark-200 text-lg">Recipe not found</p>
          <router-link to="/recipes" class="text-primary-400 hover:text-primary-300 mt-4 inline-block">
            ← Back to Recipes
          </router-link>
        </div>

        <article v-else>
          <div class="flex items-center justify-between mb-6">
            <router-link to="/recipes" class="inline-flex items-center text-primary-400 hover:text-primary-300 transition">
              ← Back to Recipes
            </router-link>
            <button
              @click="printRecipe"
              class="no-print inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Recipe
            </button>
          </div>

          <div class="flex items-center gap-3 mt-4 mb-4">
            <span class="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-full text-sm font-semibold border-2 border-primary-500/40">
              {{ content.category }}
            </span>
            <span v-if="content.date" class="text-sm text-dark-300">
              {{ formatDate(content.date) }}
            </span>
          </div>

          <h1 class="text-6xl font-bold mb-8 text-primary-500">
            {{ content.title }}
          </h1>

          <div class="prose prose-lg prose-invert max-w-none prose-headings:text-dark-100 prose-p:text-dark-200 prose-a:text-primary-400 prose-strong:text-dark-100 prose-code:text-primary-300 prose-pre:bg-dark-800 prose-pre:border prose-pre:border-primary-500/30 prose-ul:text-dark-200 prose-ol:text-dark-200" v-html="content.html"></div>
        </article>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useContent } from '@/composables/useContent'

const route = useRoute()
const { getRecipeBySlug } = useContent()
const content = ref(null)
const loading = ref(true)

onMounted(async () => {
  content.value = await getRecipeBySlug(route.params.category, route.params.slug)
  loading.value = false
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const printRecipe = () => {
  window.print()
}
</script>

<style>
@media print {
  /* Hide non-recipe elements */
  .no-print,
  nav,
  header,
  footer,
  button,
  .router-link {
    display: none !important;
  }

  /* Reset page styling for clean print */
  body {
    background: white !important;
    color: black !important;
    margin: 0;
    padding: 0;
  }

  /* Container adjustments */
  .min-h-screen {
    min-height: auto !important;
    background: white !important;
    padding: 0 !important;
  }

  /* Article styling for print */
  article {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 1in !important;
    background: white !important;
  }

  /* Recipe title */
  h1 {
    color: black !important;
    font-size: 28pt !important;
    margin-bottom: 12pt !important;
    border-bottom: 2pt solid black;
    padding-bottom: 8pt !important;
  }

  /* Recipe metadata (prep time, category, etc) */
  .flex.items-center.gap-3,
  .flex.items-center.gap-4 {
    display: flex !important;
    margin-bottom: 12pt !important;
    font-size: 11pt !important;
    color: #333 !important;
  }

  /* Category badge */
  .bg-primary-500\/20 {
    background: #f0f0f0 !important;
    color: black !important;
    border: 1pt solid #999 !important;
  }

  /* Content prose styling */
  .prose {
    max-width: 100% !important;
    color: black !important;
  }

  .prose h2 {
    color: black !important;
    font-size: 16pt !important;
    margin-top: 16pt !important;
    margin-bottom: 8pt !important;
    font-weight: bold !important;
    border-bottom: 1pt solid #ccc;
    padding-bottom: 4pt !important;
  }

  .prose h3 {
    color: black !important;
    font-size: 13pt !important;
    margin-top: 12pt !important;
    margin-bottom: 6pt !important;
    font-weight: bold !important;
  }

  .prose p,
  .prose li {
    color: black !important;
    font-size: 11pt !important;
    line-height: 1.4 !important;
  }

  .prose ul,
  .prose ol {
    margin-left: 20pt !important;
    margin-bottom: 12pt !important;
  }

  .prose li {
    margin-bottom: 4pt !important;
  }

  .prose strong {
    color: black !important;
    font-weight: bold !important;
  }

  /* Code/special formatting */
  .prose code {
    background: #f5f5f5 !important;
    color: black !important;
    padding: 2pt 4pt !important;
    border-radius: 2pt;
    font-size: 10pt !important;
  }

  .prose pre {
    background: #f5f5f5 !important;
    border: 1pt solid #ccc !important;
    padding: 8pt !important;
    margin: 8pt 0 !important;
  }

  /* Links */
  .prose a {
    color: black !important;
    text-decoration: underline !important;
  }

  /* Page breaks */
  .prose h2 {
    page-break-after: avoid;
  }

  .prose li {
    page-break-inside: avoid;
  }

  /* Remove gradients and shadows */
  * {
    background-image: none !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
}
</style>
