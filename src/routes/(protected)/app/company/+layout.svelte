<script lang="ts">
	import { page } from "$app/stores";

	let { children, data } = $props();

	const tabs = [
		{ name: "Company", href: "/app/company", icon: "company" },
		{ name: "Team", href: "/app/company/team", icon: "team" },
		{ name: "Services", href: "/app/company/services", icon: "services" },
		{ name: "Locations", href: "/app/company/locations", icon: "locations" },
	];

	const isActive = (href) => {
		if (href === "/app/company") {
			return $page.url.pathname === "/app/company";
		}
		return $page.url.pathname.startsWith(href);
	};
</script>

<div class="p-6">
	<!-- Tab Navigation -->
	<div class="mb-6 border-b border-gray-200">
		<nav class="-mb-px flex space-x-8" aria-label="Company sections">
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
					{#if tab.icon === "company"}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							/>
						</svg>
					{:else if tab.icon === "team"}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
							/>
						</svg>
					{:else if tab.icon === "services"}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							/>
						</svg>
					{:else if tab.icon === "locations"}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
							/>
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
