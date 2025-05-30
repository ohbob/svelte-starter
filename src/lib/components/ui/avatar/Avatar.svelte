<script lang="ts">
	let { src = undefined, alt = "", name = "", size = "md", class: className = "" } = $props();

	// Generate initials from name
	const getInitials = (name) => {
		if (!name) return "U";
		return name
			.split(" ")
			.map((word) => word.charAt(0))
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const sizeClasses = {
		sm: "h-8 w-8 text-xs",
		md: "h-10 w-10 text-sm",
		lg: "h-12 w-12 text-base",
	};

	let imageError = $state(false);
</script>

<div
	class="relative inline-flex items-center justify-center rounded-full bg-muted {sizeClasses[
		size
	]} {className}"
>
	{#if src && !imageError}
		<img
			{src}
			{alt}
			class="h-full w-full rounded-full object-cover"
			onerror={() => {
				imageError = true;
			}}
		/>
	{:else}
		<span class="font-medium text-muted-foreground">
			{getInitials(name || alt)}
		</span>
	{/if}
</div>
