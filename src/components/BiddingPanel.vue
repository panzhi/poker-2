<script setup lang="ts">
import type { BidType } from '../game/types'

defineProps<{
  availableBids: BidType[]
}>()

defineEmits<{
  bid: [type: BidType]
  skip: []
}>()

const labelByBid: Record<BidType, string> = {
  'xuan-bao': '宣爆',
  solo: '独',
  'declare-red-a': '宣红A',
  'declare-black-a': '宣黑A',
  'ask-red-a': '提红A',
  'ask-black-a': '提黑A',
  pass: '不叫',
}
</script>

<template>
  <section class="bidding-panel">
    <strong>叫分</strong>
    <div class="bid-grid">
      <button
        v-for="bid in availableBids"
        :key="bid"
        class="btn bid"
        :class="bid"
        type="button"
        @click="$emit('bid', bid)"
      >
        {{ labelByBid[bid] }}
      </button>
      <button class="btn ghost" type="button" @click="$emit('skip')">全部不叫</button>
    </div>
  </section>
</template>
