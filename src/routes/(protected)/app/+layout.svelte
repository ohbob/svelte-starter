<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Avatar } from "$lib/components/ui/avatar";
	import { Toaster } from "svelte-sonner";
	import { authClient } from "$lib/auth-client";
	import { page } from "$app/stores";
	import NotificationCenter from "$lib/components/NotificationCenter.svelte";

	let { data, children } = $props();
	let showMobileMenu = $state(false);

	const handleSignOut = async () => {
		await authClient.signOut();
		window.location.href = "/";
	};

	const toggleMobileMenu = () => {
		showMobileMenu = !showMobileMenu;
	};

	const closeMobileMenu = () => {
		showMobileMenu = false;
	};

	const navigation = [
		{ name: "Dashboard", href: "/app", icon: "dashboard", shortName: "Home" },
		{ name: "Company", href: "/app/company", icon: "company", shortName: "Company" },
		{ name: "Website", href: "/app/website/services", icon: "website", shortName: "Website" },
		{ name: "Calendar", href: "/app/calendar", icon: "calendar", shortName: "Calendar" },
		{ name: "Analytics", href: "/app/analytics", icon: "analytics", shortName: "Analytics" },
		{ name: "Profile", href: "/app/profile", icon: "profile", shortName: "Profile" },
	];

	const isActive = (href) => {
		if (href === "/app") {
			return $page.url.pathname === "/app";
		}
		if (href === "/app/website/services") {
			return $page.url.pathname.startsWith("/app/website");
		}
		return $page.url.pathname.startsWith(href);
	};

	const getPageTitle = () => {
		if ($page.url.pathname === "/app") return "Dashboard";
		if ($page.url.pathname.startsWith("/app/company")) return "Company";
		if ($page.url.pathname.startsWith("/app/website")) return "Website";
		if ($page.url.pathname.startsWith("/app/calendar")) return "Calendar";
		if ($page.url.pathname.startsWith("/app/analytics")) return "Analytics";
		if ($page.url.pathname.startsWith("/app/notifications")) return "Notifications";
		if ($page.url.pathname.startsWith("/app/profile")) return "Profile";
		return "Admin Panel";
	};
</script>

<!-- Desktop Layout -->
<div class="hidden h-screen bg-gray-50 lg:flex">
	<!-- Desktop Sidebar -->
	<div class="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
		<!-- Logo/Brand -->
		<div class="flex h-[73px] items-center gap-3 border-b border-gray-200 px-6 py-5">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
				<svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
					<path
						d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
					/>
				</svg>
			</div>
			<span class="text-lg font-semibold text-gray-900">Admin Panel</span>
		</div>

		<!-- Desktop Navigation -->
		<nav class="flex-1 space-y-2 px-4 py-6">
			{#each navigation.slice(0, -1) as item}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActive(
						item.href
					)
						? 'bg-gray-900 text-white'
						: 'text-gray-700 hover:bg-gray-100'}"
				>
					{#if item.icon === "dashboard"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
							></path>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"
							></path>
						</svg>
					{:else if item.icon === "company"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							></path>
						</svg>
					{:else if item.icon === "website"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							></path>
						</svg>
					{:else if item.icon === "calendar"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							></path>
						</svg>
					{:else if item.icon === "analytics"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							></path>
						</svg>
					{/if}
					{item.name}
				</a>
			{/each}
		</nav>

		<!-- View Public Profile Button -->
		<div class="border-t border-gray-200 p-4">
			<a
				href="/u/{data.user.customUrl || data.user.name || data.user.id}"
				target="_blank"
				class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
					></path>
				</svg>
				View Public Page
			</a>
		</div>

		<!-- Desktop Profile Section - Removed from sidebar -->
	</div>

	<!-- Desktop Main content area -->
	<div class="flex h-full flex-1 flex-col">
		<!-- Desktop Top header -->
		<header
			class="flex h-[73px] flex-shrink-0 items-center border-b border-gray-200 bg-white px-6 py-5"
		>
			<div class="flex w-full items-center justify-between">
				<div class="flex items-center gap-4">
					<h1 class="text-xl font-semibold text-gray-900">
						{getPageTitle()}
					</h1>
				</div>
				<div class="flex items-center gap-4">
					<NotificationCenter />
					<Button variant="ghost" size="sm">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</Button>
					<button
						onclick={toggleMobileMenu}
						class="rounded-lg p-2 transition-colors hover:bg-gray-100"
					>
						<Avatar
							src={data.user.image}
							name={data.user.name || data.user.email}
							alt={data.user.name || data.user.email}
							size="sm"
						/>
					</button>
				</div>
			</div>
		</header>

		<!-- Desktop Page content -->
		<main class="flex-1 overflow-auto bg-gray-50">
			{@render children()}
		</main>
	</div>
</div>

<!-- Mobile Layout -->
<div class="flex h-screen flex-col bg-gray-50 lg:hidden">
	<!-- Mobile Top header -->
	<header class="flex h-16 flex-shrink-0 items-center border-b border-gray-200 bg-white px-4">
		<div class="flex w-full items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
					<svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path
							d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
						/>
					</svg>
				</div>
				<h1 class="text-lg font-semibold text-gray-900">
					{getPageTitle()}
				</h1>
			</div>
			<div class="flex items-center gap-2">
				<NotificationCenter />
				<button
					onclick={toggleMobileMenu}
					class="rounded-lg p-2 transition-colors hover:bg-gray-100"
				>
					<Avatar
						src={data.user.image}
						name={data.user.name || data.user.email}
						alt={data.user.name || data.user.email}
						size="sm"
					/>
				</button>
			</div>
		</div>
	</header>

	<!-- Mobile Page content -->
	<main class="flex-1 overflow-auto bg-gray-50 pb-20">
		{@render children()}
	</main>

	<!-- Mobile Bottom Navigation -->
	<nav
		class="safe-area-pb fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-2 py-2"
	>
		<div class="flex items-center justify-around">
			{#each navigation as item}
				<a
					href={item.href}
					class="flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors {isActive(
						item.href
					)
						? 'bg-blue-50 text-blue-600'
						: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
				>
					{#if item.icon === "dashboard"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
							></path>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"
							></path>
						</svg>
					{:else if item.icon === "company"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							></path>
						</svg>
					{:else if item.icon === "website"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							></path>
						</svg>
					{:else if item.icon === "calendar"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							></path>
						</svg>
					{:else if item.icon === "analytics"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							></path>
						</svg>
					{:else if item.icon === "profile"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							></path>
						</svg>
					{/if}
					<span class="text-xs font-medium">{item.shortName}</span>
				</a>
			{/each}
		</div>
	</nav>
</div>

<!-- Profile Menu Overlay (shared by both desktop and mobile) -->
{#if showMobileMenu}
	<div
		class="fixed inset-0 z-50 bg-black bg-opacity-50"
		onclick={closeMobileMenu}
		onkeydown={(e) => e.key === "Escape" && closeMobileMenu()}
		role="dialog"
		aria-modal="true"
		aria-labelledby="profile-menu-title"
		tabindex="-1"
	>
		<div class="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-white shadow-xl">
			<div class="border-b border-gray-200 p-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<Avatar
							src={data.user.image}
							name={data.user.name || data.user.email}
							alt={data.user.name || data.user.email}
							size="md"
						/>
						<div>
							<div id="profile-menu-title" class="font-medium text-gray-900">
								{data.user.name || "User"}
							</div>
							<div class="text-sm text-gray-500">
								{data.user.email}
							</div>
						</div>
					</div>
					<button
						onclick={closeMobileMenu}
						class="rounded-lg p-2 hover:bg-gray-100"
						aria-label="Close profile menu"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>
			</div>
			<div class="p-4">
				<Button onclick={handleSignOut} variant="outline" class="w-full">Sign Out</Button>
			</div>
		</div>
	</div>
{/if}

<!-- Toaster for notifications -->
<Toaster
	position="top-center"
	closeButton
	toastOptions={{
		classes: {
			closeButton: "!absolute !top-3 !right-1 !left-auto",
		},
	}}
/>

<style>
	.safe-area-pb {
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
