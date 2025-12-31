<template>
  <DefaultLayout>
    <div class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-5xl font-bold mb-8">
          <span class="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            Blog
          </span>
        </h1>

        <div v-if="loading" class="text-center py-20">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          <p class="text-gray-400 mt-4">Loading posts...</p>
        </div>

        <div v-else-if="posts.length === 0" class="text-center py-20">
          <div class="text-6xl mb-4">📝</div>
          <p class="text-gray-400 text-lg">No blog posts yet. Add some markdown files to /src/content/blog/!</p>
        </div>

        <div v-else class="space-y-6">
          <article
            v-for="post in posts"
            :key="post.slug"
            class="group bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-8 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 cursor-pointer"
            @click="$router.push(`/blog/${post.slug}`)"
          >
            <div class="flex items-center justify-between mb-4">
              <span v-if="post.date" class="text-sm text-gray-500">
                {{ formatDate(post.date) }}
              </span>
              <span v-if="post.updated && post.updated !== post.date" class="text-xs text-gray-600">
                Updated: {{ formatDate(post.updated) }}
              </span>
            </div>
            <h2 class="text-3xl font-bold text-gray-100 mb-4 group-hover:text-primary-400 transition">{{ post.title }}</h2>
            <p class="text-gray-400 mb-6 text-lg">{{ post.description }}</p>
            <div class="flex gap-2">
              <span
                v-for="tag in post.tags"
                :key="tag"
                class="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs border border-gray-600"
              >
                {{ tag }}
              </span>
            </div>
          </article>
        </div>
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
