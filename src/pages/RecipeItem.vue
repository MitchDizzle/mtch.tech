<template>
  <DefaultLayout>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Loading...</p>
      </div>

      <div v-else-if="!content" class="text-center py-12">
        <p class="text-gray-600">Recipe not found</p>
        <router-link to="/recipes" class="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          &larr; Back to Recipes
        </router-link>
      </div>

      <article v-else>
        <router-link to="/recipes" class="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          &larr; Back to Recipes
        </router-link>

        <div class="flex items-center gap-3 mt-4 mb-4">
          <span class="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
            {{ content.category }}
          </span>
          <span v-if="content.date" class="text-sm text-gray-600">
            {{ formatDate(content.date) }}
          </span>
        </div>

        <h1 class="text-4xl font-bold text-gray-900 mb-6">{{ content.title }}</h1>

        <div class="prose prose-lg max-w-none" v-html="content.html"></div>
      </article>
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
