<template>
  <DefaultLayout>
    <div class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-5xl font-bold mb-8">
          <span class="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            Portfolio
          </span>
        </h1>
        
        <div v-if="loading" class="text-center py-20">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          <p class="text-gray-400 mt-4">Loading projects...</p>
        </div>
        
        <div v-else-if="projects.length === 0" class="text-center py-20">
          <div class="text-6xl mb-4">📦</div>
          <p class="text-gray-400 text-lg">No projects yet. Add some markdown files to /src/content/portfolio/!</p>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="project in projects" 
            :key="project.slug"
            class="group bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl overflow-hidden hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 cursor-pointer transform hover:scale-105"
            @click="$router.push(`/portfolio/${project.slug}`)"
          >
            <div v-if="project.image" class="h-48 bg-gray-700 overflow-hidden">
              <img :src="project.image" :alt="project.title" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div class="p-6">
              <h3 class="text-xl font-semibold text-gray-100 mb-2 group-hover:text-primary-400 transition">{{ project.title }}</h3>
              <p class="text-gray-400 mb-4">{{ project.description }}</p>
              <div class="flex items-center justify-between text-sm">
                <span v-if="project.date" class="text-gray-500">{{ formatDate(project.date) }}</span>
                <div class="flex gap-2">
                  <span 
                    v-for="tag in project.tags?.slice(0, 2)" 
                    :key="tag"
                    class="px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-xs border border-primary-500/30"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
const projects = ref([])
const loading = ref(true)

onMounted(async () => {
  projects.value = await getContentByCategory('portfolio')
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
