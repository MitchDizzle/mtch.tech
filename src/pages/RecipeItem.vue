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
          <router-link to="/recipes" class="inline-flex items-center text-primary-400 hover:text-primary-300 mb-6 transition">
            ← Back to Recipes
          </router-link>

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
</script>
