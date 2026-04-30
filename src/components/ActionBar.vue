<script setup lang="ts">
defineProps<{
  canSubmit: boolean
  canPass: boolean
}>()

defineEmits<{
  play: []
  pass: []
}>()
</script>

<template>
  <section class="actions">
    <button class="btn ghost" type="button" :disabled="!canPass" @click="$emit('pass')">跳过</button>
    <button class="btn primary" type="button" :disabled="!canSubmit" @click="$emit('play')">出牌</button>
  </section>
</template>
