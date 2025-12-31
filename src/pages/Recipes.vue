<template>
  <DefaultLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-8">Recipes</h1>

      <div class="mb-8">
        <div class="flex gap-4 border-b border-gray-200">
          <button
            @click="activeCategory = 'all'"
            :class="['px-4 py-2 font-medium transition', activeCategory === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900']"
          >
            All
          </button>
          <button
            @click="activeCategory = 'baking'"
            :class="['px-4 py-2 font-medium transition', activeCategory === 'baking' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900']"
          >
            Baking
          </button>
          <button
            @click="activeCategory = 'cooking'"
            :class="['px-4 py-2 font-medium transition', activeCategory === 'cooking' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900']"
          >
            Cooking
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-600">Loading recipes...</p>
      </div>

      <div v-else-if="filteredRecipes.length === 0" class="text-center py-12">
        <p class="text-gray-600">No recipes yet. Add some markdown files to /src/content/recipes/!</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="recipe in filteredRecipes"
          :key="recipe.slug"
          class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
          @click="$router.push(`/recipes/${recipe.category}/${recipe.slug}`)"
        >
          <div v-if="recipe.image" class="h-48 bg-gray-200">
            <img :src="recipe.image" :alt="recipe.title" class="w-full h-full object-cover" />
          </div>
          <div class="p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                {{ recipe.category }}
              </span>
              <span v-if="recipe.date" class="text-xs text-gray-500">
                {{ formatDate(recipe.date) }}
              </span>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ recipe.title }}</h3>
            <p class="text-gray-600 text-sm">{{ recipe.description }}</p>
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
