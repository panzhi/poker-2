<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/gameStore'
import ActionBar from './ActionBar.vue'
import BiddingPanel from './BiddingPanel.vue'
import PlayerSeat from './PlayerSeat.vue'
import PlayingCard from './PlayingCard.vue'

const game = useGameStore()
const { availableBids, currentTrick, message, phase, players, selectedCardIds } = storeToRefs(game)
const playerName = ref(`玩家${Math.floor(Math.random() * 900 + 100)}`)
const roomCodeInput = ref('')
const mode = ref<4 | 5>(4)

onMounted(() => {
  game.connect().catch((error: unknown) => {
    game.message = error instanceof Error ? error.message : '连接失败'
  })
})
</script>

<template>
  <main class="table-shell">
    <header class="topbar">
      <div class="brand">
        <span class="logo">♠</span>
        <div>
          <strong>Team Poker</strong>
          <small>第 {{ game.roundNo }} 局</small>
        </div>
      </div>
      <div class="toolbar">
        <input v-model="playerName" class="input" maxlength="12" placeholder="昵称" />
        <select v-model="mode" class="input">
          <option :value="4">4 人局</option>
          <option :value="5">5 人局</option>
        </select>
        <button class="btn" type="button" @click="game.createRoom(playerName, mode)">创建房间</button>
        <input v-model="roomCodeInput" class="input room-input" maxlength="6" placeholder="房间号" />
        <button class="btn" type="button" @click="game.joinRoom(playerName, roomCodeInput)">加入</button>
        <button class="btn primary" type="button" :disabled="!game.isOwner || !game.roomIsFull" @click="game.startRound()">
          开始 / 下一局
        </button>
      </div>
    </header>

    <section class="status-strip">
      <span>{{ game.connected ? '已连接' : '未连接' }}</span>
      <span v-if="game.roomCode">房间号：{{ game.roomCode }}</span>
      <span>{{ players.length }}/{{ game.mode }} 人</span>
      <span>{{ message }}</span>
      <span v-if="game.bid">叫分：{{ game.bid.type }}</span>
      <span v-if="game.lastScoreResult">{{ game.winnerLabel }} {{ game.lastScoreResult.sequence }}</span>
    </section>

    <section class="opponents">
      <PlayerSeat
        v-for="player in players.filter((item) => item.id !== game.selfPlayerId)"
        :key="player.id"
        :player="player"
        :active="player.id === game.currentPlayerId"
        :revealed="Boolean(game.bid?.revealedPlayerIds.includes(player.id))"
      />
    </section>

    <section class="center-table">
      <div class="played-cards" :class="{ empty: !currentTrick }">
        <template v-if="currentTrick">
          <PlayingCard v-for="card in currentTrick.cards" :key="card.id" :card="card" small />
        </template>
        <p v-else>等待出牌</p>
      </div>
    </section>

    <BiddingPanel
      v-if="phase === 'bidding' && game.currentPlayerId === game.me?.id"
      :available-bids="availableBids"
      @bid="game.placeBid"
      @skip="game.skipBidding"
    />

    <ActionBar
      v-if="phase === 'playing'"
      :can-submit="game.canSubmit"
      :can-pass="Boolean(currentTrick) && game.currentPlayerId === game.me?.id"
      @play="game.playSelectedCards"
      @pass="game.pass"
    />

    <section v-if="game.me" class="self-area">
      <PlayerSeat :player="game.me" :active="game.me.id === game.currentPlayerId" revealed />
      <div class="hand">
        <PlayingCard
          v-for="card in game.me.hand"
          :key="card.id"
          :card="card"
          :selected="selectedCardIds.includes(card.id)"
          @click="game.toggleCard(card.id)"
        />
      </div>
    </section>

    <aside v-if="phase === 'settlement' && game.lastScoreResult" class="settlement">
      <h2>{{ game.winnerLabel }}</h2>
      <p>出完序列：{{ game.lastScoreResult.sequence }}</p>
      <ul>
        <li v-for="player in players" :key="player.id">
          {{ player.name }}：{{ game.lastScoreResult.deltaByPlayerId[player.id] ?? 0 }} / 总分 {{ player.score }}
        </li>
      </ul>
    </aside>
  </main>
</template>
