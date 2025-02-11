<script>
  import { onMount } from 'svelte';
  import { isPermitted, requestPermission, sendNotification } from '@tauri-apps/api/notification';

  let cards = [];

  onMount(async () => {
	try {
	  // Request notification permission
	  if (!await isPermitted()) {
		await requestPermission();
	  }

	  // Connect to WebSocket
	  const ws = new WebSocket('wss://faye.chalamministries.com:8999');
	  
	  ws.onmessage = (event) => {
		const data = JSON.parse(event.data);
		
		// Show native notification
		sendNotification({
		  title: data.member,
		  body: data.message || data.membership
		});

		// Add to card history
		cards = [
		  {
			...data,
			timestamp: new Date().toISOString()
		  },
		  ...cards
		].slice(0, 100); // Keep last 100 cards
	  };

	  ws.onerror = (error) => {
		console.error('WebSocket error:', error);
	  };

	  ws.onclose = () => {
		console.log('WebSocket connection closed. Attempting to reconnect...');
		setTimeout(() => {
		  // Attempt to reconnect
		}, 5000);
	  };
	} catch (error) {
	  console.error('Error in onMount:', error);
	}
  });
</script>

<main>
  <h3>Checkins</h3>
  <div class="cards-container">
	{#if cards.length === 0}
	  <div class="empty-state">No checkins yet</div>
	{/if}
	{#each cards as card}
	  <div class="card {card.redAlert ? 'red' : card.balanceDue && card.balance > 25 ? 'yellow' : 'green'}">
		<div class="card-header">
		  <img 
			src={card.image || 'person_placeholder.png'} 
			class="card-avatar" 
			alt=""
		  />
		  <div class="card-title">
			<h3>{card.member}</h3>
			<p class="card-membership">{card.membership || ''}</p>
		  </div>
		  <span class="card-time">
			{new Date(card.timestamp).toLocaleTimeString()}
		  </span>
		</div>
		{#if card.redAlert}
		  <p class="card-alert">ALERT: {card.message}</p>
		{/if}
		{#if card.balanceDue}
		  <p class="card-alert">BALANCE DUE: ${card.balance}</p>
		{/if}
	  </div>
	{/each}
  </div>
</main>

<style>
  main {
	width: 100%;
	height: 100%;
	padding: 16px;
	box-sizing: border-box;
	background-color: #f5f5f5;
  }

  h3 {
	margin: 0 0 16px 0;
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

  .card.red { border-left: 4px solid #F44336; }
  .card.yellow { border-left: 4px solid #FFC107; }
  .card.green { border-left: 4px solid #4CAF50; }

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
	margin: 8px 0 0 0;
	color: #D32F2F;
	font-weight: 500;
  }
</style>