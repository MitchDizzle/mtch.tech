<template>
  <DefaultLayout>
    <div class="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-6xl font-bold mb-8 text-primary-500">
          Recipes
        </h1>

        <div class="mb-8">
          <div class="flex gap-4 border-b-2 border-primary-500/20">
            <button
              @click="activeCategory = 'all'"
              :class="['px-6 py-3 font-medium transition-all duration-200', activeCategory === 'all' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-dark-300 hover:text-primary-400']"
            >
              All
            </button>
            <button
              @click="activeCategory = 'baking'"
              :class="['px-6 py-3 font-medium transition-all duration-200', activeCategory === 'baking' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-dark-300 hover:text-primary-400']"
            >
              🍰 Baking
            </button>
            <button
              @click="activeCategory = 'cooking'"
              :class="['px-6 py-3 font-medium transition-all duration-200', activeCategory === 'cooking' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-dark-300 hover:text-primary-400']"
            >
              🍳 Cooking
            </button>
          </div>
        </div>

        <div v-if="loading" class="text-center py-20">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          <p class="text-dark-300 mt-4">Loading recipes...</p>
        </div>

        <div v-else-if="filteredRecipes.length === 0" class="text-center py-20">
          <div class="text-6xl mb-4">🍴</div>
          <p class="text-dark-200 text-lg">No recipes yet. Add some markdown files to /src/content/recipes/!</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="recipe in filteredRecipes"
            :key="recipe.slug"
            class="group bg-dark-800/80 backdrop-blur border-2 border-primary-500/30 rounded-xl overflow-hidden hover:border-primary-500 hover:shadow-xl hover:shadow-primary-500/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
            @click="$router.push(`/recipes/${recipe.category}/${recipe.slug}`)"
          >
            <div v-if="recipe.image" class="h-48 bg-dark-700">
              <img :src="recipe.image" :alt="recipe.title" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div class="p-6">
              <div class="flex items-center justify-between mb-3">
                <span class="px-3 py-2 bg-primary-500/20 text-primary-300 rounded-full text-xs font-semibold border border-primary-500/40">
                  {{ recipe.category }}
                </span>
                <span v-if="recipe.date" class="text-xs text-dark-300">
                  {{ formatDate(recipe.date) }}
                </span>
              </div>
              <h3 class="text-xl font-semibold text-dark-100 mb-2 group-hover:text-primary-400 transition">{{ recipe.title }}</h3>
              <p class="text-dark-200 text-sm">{{ recipe.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useContent } from '@/composables/useContent'

const { getRecipes } = useContent()
const recipes = ref([])
const loading = ref(true)
const activeCategory = ref('all')

onMounted(async () => {
  recipes.value = await getRecipes()
  loading.value = false
})

const filteredRecipes = computed(() => {
  if (activeCategory.value === 'all') {
    return recipes.value
  }
  return recipes.value.filter(r => r.category === activeCategory.value)
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
