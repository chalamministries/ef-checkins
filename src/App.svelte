<script>
  import { onMount } from 'svelte';
  import { listen } from '@tauri-apps/api/event';
  
  let cards = [];

  onMount(async () => {
	await listen('checkin-data', (event) => {
	  const data = event.payload;
	  cards = [
		{
		  ...data,
		  timestamp: new Date().toISOString()
		},
		...cards
	  ].slice(0, 100);
	});
  });
</script>

<main>
  <div class="header">
	<h3>Checkins</h3>
  </div>
  
  <div class="cards-container">
	{#if cards.length === 0}
	  <div class="empty-state">No checkins yet</div>
	{:else}
	  {#each cards as card}
		<div class="card {card.redAlert || card.status != 1 || (card.balanceDue && card.balance > 25) ? 'red' : (card.balanceDue && card.balance <= 25) || card.yellowAlert ? 'yellow' : 'green'}">
		  <div class="card-header">
			<img 
			  src={card.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%23E0E0E0"/%3E%3Ccircle cx="20" cy="16" r="7" fill="%239E9E9E"/%3E%3Cpath d="M8 36c0-8 6-12 12-12s12 4 12 12" fill="%239E9E9E"/%3E%3C/svg%3E'} 
			  class="card-avatar" 
			  alt=""
			  on:error={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"%3E%3Crect width="40" height="40" fill="%23E0E0E0"/%3E%3Ccircle cx="20" cy="16" r="7" fill="%239E9E9E"/%3E%3Cpath d="M8 36c0-8 6-12 12-12s12 4 12 12" fill="%239E9E9E"/%3E%3C/svg%3E'}
			/>
			<div class="card-title">
			  <h3>{card.member}</h3>
			  <p class="card-membership {card.status === 2 || card.status === 0 ? 'card-alert' : ''}">{card.status == 1 ? card.membership : card.status == 2 ? 'EXPIRED' : card.status == 0 ? 'NO MEMBERSHIP' : card.message}</p>
			</div>
			<span class="card-time">
			  {new Date(card.timestamp).toLocaleTimeString()}
			</span>
		  </div>
		  {#if card.redAlert}
			<p class="card-alert"><span style="color: red; font-weight: 700">ALERT:</span> {card.redAlert}</p>
		  {/if}
		  {#if card.yellowAlert}
			  <p class="card-alert"><span style="color: #bf9500; font-weight: 700">WARNING:</span> {card.yellowAlert}</p>
		  {/if}
		  {#if card.balanceDue}
			<p class="card-alert"><strong>BALANCE DUE:</strong> ${card.balance}</p>
		  {/if}
		</div>
	  {/each}
	{/if}
  </div>
</main>

<style>
  .header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
  }

  .test-button {
	padding: 8px 16px;
	background-color: #4CAF50;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
  }

  .test-button:hover {
	background-color: #45a049;
  }

  main {
	width: 100%;
	height: 100%;
	padding: 16px;
	box-sizing: border-box;
	background-color: #f5f5f5;
  }

  h3 {
	margin: 0;
	color: #333;
	font-size: 1.2rem;
  }

  .cards-container {
	height: calc(100% - 40px);
	overflow-y: auto;
  }

  .empty-state {
	text-align: center;
	color: #666;
	padding: 2rem;
  }

  .card {
	padding: 12px;
	margin-bottom: 12px;
	border-radius: 8px;
	background: white;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .card.red { border-left: 4px solid #F44336; background-color: #FFEBEE; }
  .card.yellow { border-left: 4px solid #FFC107; background-color: #FFF8E1; }
  .card.green { border-left: 4px solid #4CAF50; background-color: #E8F5E9; }

  .card-header {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 8px;
  }

  .card-avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	object-fit: cover;
	background-color: #f5f5f5;
  }

  .card-title { flex: 1; }

  .card-title h3 {
	margin: 0;
	font-size: 14px;
	font-weight: 500;
  }

  .card-membership {
	margin: 4px 0 0 0;
	font-size: 12px;
	color: #666;
  }

  .card-time {
	font-size: 12px;
	color: #999;
  }

  .card-alert {
	margin: 4px 0 0 0;
	font-size: 14px;
  }
  
  .card-membership.card-alert {
  	color: red;
	font-weight: 700;
  }
</style>