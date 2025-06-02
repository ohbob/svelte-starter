<script lang="ts">
	let { title, description, class: className = "", children } = $props();
</script>

<div class="card {className}">
	{#if title || description}
		<div class="card-header">
			{#if title}
				<h2 class="text-lg font-semibold text-gray-900">{title}</h2>
			{/if}
			{#if description}
				<p class="mt-1 text-sm text-gray-500">{description}</p>
			{/if}
		</div>
	{/if}

	<div class="card-content">
		{@render children()}
	</div>
</div>
