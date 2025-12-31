<template>
  <DefaultLayout>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-8">Blog</h1>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Loading posts...</p>
      </div>

      <div v-else-if="posts.length === 0" class="text-center py-12">
        <p class="text-gray-600">No blog posts yet. Add some markdown files to /src/content/blog/!</p>
      </div>

      <div v-else class="space-y-8">
        <article
          v-for="post in posts"
          :key="post.slug"
          class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
          @click="$router.push(`/blog/${post.slug}`)"
        >
          <div class="flex items-center justify-between mb-3">
            <span v-if="post.date" class="text-sm text-gray-500">
              {{ formatDate(post.date) }}
            </span>
            <span v-if="post.updated && post.updated !== post.date" class="text-xs text-gray-400">
              Updated: {{ formatDate(post.updated) }}
            </span>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-3">{{ post.title }}</h2>
          <p class="text-gray-600 mb-4">{{ post.description }}</p>
          <div class="flex gap-2">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
            >
              {{ tag }}
            </span>
          </div>
        </article>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useContent } from '@/composables/useContent'

const { getContentByCategory } = useContent()
const posts = ref([])
const loading = ref(true)

onMounted(async () => {
  posts.value = await getContentByCategory('blog')
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
