<script lang="ts">
	import { page } from "$app/stores";

	let { children } = $props();

	const tabs = [
		{ name: "Overview", href: "/app/analytics", icon: "overview" },
		{ name: "Referrers", href: "/app/analytics/referrers", icon: "referrers" },
	];

	const isActive = (href) => {
		if (href === "/app/analytics") {
			return $page.url.pathname === "/app/analytics";
		}
		return $page.url.pathname.startsWith(href);
	};
</script>

<div class="p-6">
	<!-- Tab Navigation -->
	<div class="mb-6 border-b border-gray-200">
		<nav class="-mb-px flex space-x-8" aria-label="Analytics sections">
			{#each tabs as tab}
				<a
					href={tab.href}
					class="inline-flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition-colors {isActive(
						tab.href
					)
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
					aria-current={isActive(tab.href) ? "page" : undefined}
				>
					{#if tab.icon === "overview"}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							></path>
						</svg>
					{:else if tab.icon === "referrers"}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
							></path>
						</svg>
					{/if}
					{tab.name}
				</a>
			{/each}
		</nav>
	</div>

	<!-- Tab Content -->
	<div class="flex-1">
		{@render children()}
	</div>
</div>
