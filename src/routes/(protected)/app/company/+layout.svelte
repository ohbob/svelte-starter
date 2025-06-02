<script lang="ts">
	import { page } from "$app/stores";

	let { children } = $props();

	const tabs = [
		{ name: "Business Info", href: "/app/company/business-info", icon: "business" },
		{ name: "Team Members", href: "/app/company/team", icon: "team" },
		{ name: "Locations", href: "/app/company/locations", icon: "locations" },
		{ name: "Services", href: "/app/company/services", icon: "services" },
		{ name: "Booking & CTA", href: "/app/company/booking", icon: "booking" },
		{ name: "Social & Online", href: "/app/company/social", icon: "social" },
		{ name: "Testimonials", href: "/app/company/testimonials", icon: "testimonials" },
		{ name: "Blog & Articles", href: "/app/company/blog", icon: "blog" },
		{ name: "Legal & Compliance", href: "/app/company/legal", icon: "legal" },
		{ name: "Technical Setup", href: "/app/company/technical", icon: "technical" },
		{ name: "Preferences", href: "/app/company/preferences", icon: "preferences" },
	];

	const isActive = (href) => {
		return $page.url.pathname.startsWith(href);
	};
</script>

<div class="grid h-full grid-rows-[auto_1fr] p-6">
	<!-- Tab Navigation -->
	<div class="mb-6 min-w-0 border-b border-gray-200">
		<nav class="scrollbar-hide -mb-px flex space-x-8 overflow-x-auto" aria-label="Company sections">
			{#each tabs as tab}
				<a
					href={tab.href}
					class="inline-flex flex-shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium transition-colors {isActive(
						tab.href
					)
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
					aria-current={isActive(tab.href) ? "page" : undefined}
				>
					{#if tab.icon === "business"}
						📋
					{:else if tab.icon === "team"}
						👥
					{:else if tab.icon === "locations"}
						📍
					{:else if tab.icon === "services"}
						⚡
					{:else if tab.icon === "booking"}
						📅
					{:else if tab.icon === "social"}
						🌐
					{:else if tab.icon === "testimonials"}
						💬
					{:else if tab.icon === "blog"}
						📝
					{:else if tab.icon === "legal"}
						⚖️
					{:else if tab.icon === "technical"}
						🔧
					{:else if tab.icon === "preferences"}
						📋
					{/if}
					{tab.name}
				</a>
			{/each}
		</nav>
	</div>

	<!-- Tab Content -->
	<div class="min-w-0">
		{@render children()}
	</div>
</div>

<style>
	/* Hide scrollbar for webkit browsers */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for IE, Edge and Firefox */
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>
