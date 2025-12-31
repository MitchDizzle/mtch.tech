<template>
  <DefaultLayout>
    <div class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div v-if="loading" class="text-center py-20">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>

        <div v-else-if="!content" class="text-center py-20">
          <p class="text-gray-400 text-lg">Recipe not found</p>
          <router-link to="/recipes" class="text-primary-400 hover:text-primary-300 mt-4 inline-block">
            ← Back to Recipes
          </router-link>
        </div>

        <article v-else>
          <router-link to="/recipes" class="inline-flex items-center text-primary-400 hover:text-primary-300 mb-6 transition">
            ← Back to Recipes
          </router-link>

          <div class="flex items-center gap-3 mt-4 mb-4">
            <span class="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-full text-sm font-medium border border-primary-500/30">
              {{ content.category }}
            </span>
            <span v-if="content.date" class="text-sm text-gray-500">
              {{ formatDate(content.date) }}
            </span>
          </div>

          <h1 class="text-5xl font-bold mb-8">
            <span class="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              {{ content.title }}
            </span>
          </h1>

          <div class="prose prose-lg prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-primary-400 prose-strong:text-gray-200 prose-code:text-primary-300 prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700 prose-ul:text-gray-300 prose-ol:text-gray-300" v-html="content.html"></div>
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
