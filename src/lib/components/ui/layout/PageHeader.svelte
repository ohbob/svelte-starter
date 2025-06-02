<script lang="ts">
	let { title, description, class: className = "" } = $props();
</script>

<div class="page-header {className}">
	<h1 class="page-title">{title}</h1>
	{#if description}
		<p class="page-description">{description}</p>
	{/if}
</div>
