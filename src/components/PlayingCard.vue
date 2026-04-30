<script setup lang="ts">
import type { Card } from '../game/types'

defineProps<{
  card: Card
  selected?: boolean
  small?: boolean
}>()

const suitText: Record<Card['suit'], string> = {
  S: '♠',
  H: '♥',
  C: '♣',
  D: '♦',
  JOKER: '★',
}
</script>

<template>
  <button
    class="card"
    :class="{
      red: card.color === 'red',
      selected,
      small,
      joker: card.suit === 'JOKER',
    }"
    type="button"
  >
    <span class="rank">{{ card.rank }}</span>
    <span class="suit">{{ suitText[card.suit] }}</span>
    <span class="center">{{ card.suit === 'JOKER' ? card.rank : suitText[card.suit] }}</span>
  </button>
</template>
