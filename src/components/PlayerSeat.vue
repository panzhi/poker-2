<script setup lang="ts">
import type { Player } from '../game/types'

defineProps<{
  player: Player
  active: boolean
  revealed?: boolean
}>()
</script>

<template>
  <article class="seat" :class="{ active, finished: player.finishedRank, revealed }">
    <div class="avatar">{{ player.name.slice(0, 1) }}</div>
    <div class="seat-meta">
      <strong>{{ player.name }}</strong>
      <span>{{ revealed || player.finishedRank ? player.team ?? '?' : '?' }} / {{ player.score }} 分</span>
      <span>手牌 {{ player.handCount ?? player.hand.length }}</span>
    </div>
    <i v-if="player.finishedRank" class="rank-badge">#{{ player.finishedRank }}</i>
    <i v-else-if="player.autoPlay" class="bot-badge">AI</i>
  </article>
</template>
