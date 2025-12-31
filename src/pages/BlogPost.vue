<template>
  <DefaultLayout>
    <div class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div v-if="loading" class="text-center py-20">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>

        <div v-else-if="!content" class="text-center py-20">
          <p class="text-gray-400 text-lg">Post not found</p>
          <router-link to="/blog" class="text-primary-400 hover:text-primary-300 mt-4 inline-block">
            ← Back to Blog
          </router-link>
        </div>

        <article v-else>
          <router-link to="/blog" class="inline-flex items-center text-primary-400 hover:text-primary-300 mb-6 transition">
            ← Back to Blog
          </router-link>

          <h1 class="text-5xl font-bold mt-4 mb-6">
            <span class="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              {{ content.title }}
            </span>
          </h1>

          <div class="flex items-center gap-4 mb-6 text-sm text-gray-500">
            <span v-if="content.date">{{ formatDate(content.date) }}</span>
            <span v-if="content.updated && content.updated !== content.date">
              Updated: {{ formatDate(content.updated) }}
            </span>
          </div>

          <div class="flex gap-2 mb-8">
            <span
              v-for="tag in content.tags"
              :key="tag"
              class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-600"
            >
              {{ tag }}
            </span>
          </div>

          <div class="prose prose-lg prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-primary-400 prose-strong:text-gray-200 prose-code:text-primary-300 prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700" v-html="content.html"></div>
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
const { getContentBySlug } = useContent()
const content = ref(null)
const loading = ref(true)

onMounted(async () => {
  content.value = await getContentBySlug('blog', route.params.slug)
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
