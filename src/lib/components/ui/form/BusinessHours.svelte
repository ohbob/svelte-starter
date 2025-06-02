<script lang="ts">
	let { businessHours = $bindable(), class: className = "" } = $props();
</script>

<div class="space-y-2 {className}">
	{#each businessHours as day}
		<div class="flex items-center gap-3">
			<div class="w-20">
				<input type="checkbox" bind:checked={day.isOpen} id="day-{day.day}" class="mr-2" />
				<label for="day-{day.day}" class="text-xs font-medium text-gray-700">
					{day.day.slice(0, 3)}
				</label>
			</div>

			{#if day.isOpen}
				<div class="flex items-center gap-2">
					<input
						type="time"
						bind:value={day.open}
						class="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<span class="text-xs text-gray-500">to</span>
					<input
						type="time"
						bind:value={day.close}
						class="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			{:else}
				<div class="text-xs text-gray-400">Closed</div>
			{/if}
		</div>
	{/each}
</div>
