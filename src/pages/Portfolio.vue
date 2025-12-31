<template>
  <DefaultLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-8">Portfolio</h1>
      
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Loading projects...</p>
      </div>
      
      <div v-else-if="projects.length === 0" class="text-center py-12">
        <p class="text-gray-600">No projects yet. Add some markdown files to /src/content/portfolio/!</p>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="project in projects" 
          :key="project.slug"
          class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
          @click="$router.push(`/portfolio/${project.slug}`)"
        >
          <div v-if="project.image" class="h-48 bg-gray-200">
            <img :src="project.image" :alt="project.title" class="w-full h-full object-cover" />
          </div>
          <div class="p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ project.title }}</h3>
            <p class="text-gray-600 mb-4">{{ project.description }}</p>
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span v-if="project.date">{{ formatDate(project.date) }}</span>
              <div class="flex gap-2">
                <span 
                  v-for="tag in project.tags?.slice(0, 2)" 
                  :key="tag"
                  class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {{ tag }}
                </span>
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
