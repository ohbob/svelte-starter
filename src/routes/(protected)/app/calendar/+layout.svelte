<script lang="ts">
	import { page } from "$app/stores";

	let { children } = $props();

	const tabs = [
		{ name: "Overview", href: "/app/calendar", icon: "overview" },
		{ name: "Meeting Types", href: "/app/calendar/meetings", icon: "meetings" },
		{ name: "Availability", href: "/app/calendar/availability", icon: "availability" },
		{ name: "Bookings", href: "/app/calendar/bookings", icon: "bookings" },
	];

	const isActive = (href) => {
		if (href === "/app/calendar") {
			return $page.url.pathname === "/app/calendar";
		}
		return $page.url.pathname.startsWith(href);
	};
</script>

<div class="p-6">
	<!-- Tab Navigation -->
	<div class="mb-6 border-b border-gray-200">
		<nav class="-mb-px flex space-x-8" aria-label="Calendar sections">
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
					{:else if tab.icon === "meetings"}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							></path>
						</svg>
					{:else if tab.icon === "availability"}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
					{:else if tab.icon === "bookings"}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
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
