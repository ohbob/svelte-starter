<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Avatar } from "$lib/components/ui/avatar";
	import { Toaster } from "svelte-sonner";
	import { authClient } from "$lib/auth-client";
	import { page } from "$app/stores";
	import NotificationCenter from "$lib/components/NotificationCenter.svelte";

	let { data, children } = $props();

	const handleSignOut = async () => {
		await authClient.signOut();
		window.location.href = "/";
	};

	const navigation = [
		{ name: "Dashboard", href: "/app", icon: "dashboard" },
		{ name: "Services", href: "/app/services", icon: "services" },
		{ name: "Calendar", href: "/app/calendar", icon: "calendar" },
		{ name: "Analytics", href: "/app/analytics", icon: "analytics" },
		{ name: "Notifications", href: "/app/notifications", icon: "notifications" },
		{ name: "Profile", href: "/app/profile", icon: "profile" },
	];

	const isActive = (href) => {
		if (href === "/app") {
			return $page.url.pathname === "/app";
		}
		return $page.url.pathname.startsWith(href);
	};
</script>

<div class="flex h-screen bg-gray-50">
	<!-- Sidebar -->
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

		<!-- Navigation -->
		<nav class="flex-1 space-y-2 px-4 py-6">
			{#each navigation as item}
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
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"
							/>
						</svg>
					{:else if item.icon === "services"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							/>
						</svg>
					{:else if item.icon === "calendar"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					{:else if item.icon === "analytics"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
					{:else if item.icon === "notifications"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
							/>
						</svg>
					{:else if item.icon === "profile"}
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
					{/if}
					{item.name}
				</a>
			{/each}
		</nav>

		<!-- User section at bottom -->
		<div class="border-t border-gray-200 p-4">
			<div class="mb-3 flex items-center gap-3">
				<Avatar
					src={data.user.image}
					name={data.user.name || data.user.email}
					alt={data.user.name || data.user.email}
					size="sm"
				/>
				<div class="min-w-0 flex-1">
					<div class="truncate text-sm font-medium text-gray-900">
						{data.user.name || "User"}
					</div>
					<div class="truncate text-xs text-gray-500">
						{data.user.email}
					</div>
				</div>
			</div>
			<Button onclick={handleSignOut} variant="outline" size="sm" class="w-full text-xs">
				Sign Out
			</Button>
		</div>
	</div>

	<!-- Main content area -->
	<div class="flex h-full flex-1 flex-col">
		<!-- Top header -->
		<header
			class="flex h-[73px] flex-shrink-0 items-center border-b border-gray-200 bg-white px-6 py-5"
		>
			<div class="flex w-full items-center justify-between">
				<div class="flex items-center gap-4">
					<h1 class="text-xl font-semibold text-gray-900">
						{#if $page.url.pathname === "/app"}
							Dashboard
						{:else if $page.url.pathname.startsWith("/app/services")}
							Services
						{:else if $page.url.pathname.startsWith("/app/calendar")}
							Calendar
						{:else if $page.url.pathname.startsWith("/app/analytics")}
							Analytics
						{:else if $page.url.pathname.startsWith("/app/notifications")}
							Notifications
						{:else if $page.url.pathname.startsWith("/app/profile")}
							Profile
						{:else}
							Admin Panel
						{/if}
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
					<div class="text-sm text-gray-600">
						{data.user.name || data.user.email}
					</div>
				</div>
			</div>
		</header>

		<!-- Page content -->
		<main class="flex-1 overflow-auto bg-gray-50">
			{@render children()}
		</main>
	</div>
</div>

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
