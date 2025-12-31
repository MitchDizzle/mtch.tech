<template>
  <DefaultLayout>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Loading...</p>
      </div>

      <div v-else-if="!content" class="text-center py-12">
        <p class="text-gray-600">Post not found</p>
        <router-link to="/blog" class="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          &larr; Back to Blog
        </router-link>
      </div>

      <article v-else>
        <router-link to="/blog" class="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          &larr; Back to Blog
        </router-link>

        <h1 class="text-4xl font-bold text-gray-900 mt-4 mb-4">{{ content.title }}</h1>

        <div class="flex items-center gap-4 mb-6 text-sm text-gray-600">
          <span v-if="content.date">{{ formatDate(content.date) }}</span>
          <span v-if="content.updated && content.updated !== content.date">
            Updated: {{ formatDate(content.updated) }}
          </span>
        </div>

        <div class="flex gap-2 mb-8">
          <span
            v-for="tag in content.tags"
            :key="tag"
            class="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
          >
            {{ tag }}
          </span>
        </div>

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
