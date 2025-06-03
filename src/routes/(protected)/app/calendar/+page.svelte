<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { toast } from "$lib/utils/toast";
	import { invalidateAll } from "$app/navigation";
	import { enhance } from "$app/forms";
	import Button from "$lib/components/ui/button/button.svelte";

	let { data } = $props();

	// State
	let loading = $state(true);
	let isCalendarConnected = $state(false);
	let calendarIntegration = $state(null);
	let meetingTypes = $state([]);
	let availabilityTemplates = $state([]);
	let upcomingBookings = $state(0);

	// Simple data sync
	$effect(() => {
		isCalendarConnected = data.isCalendarConnected || false;
		calendarIntegration = data.calendarIntegration || null;
		meetingTypes = data.meetingTypes || [];
		availabilityTemplates = data.availabilityTemplates || [];
		upcomingBookings = data.upcomingBookings || 0;
		loading = false;
	});

	onMount(async () => {
		// Check for connection status from URL params
		const connected = $page.url.searchParams.get("connected");
		const error = $page.url.searchParams.get("error");

		if (connected) {
			toast.success("Calendar connected successfully!");
			await invalidateAll();
		} else if (error) {
			const errorMessages = {
				access_denied: "Calendar connection was denied",
				missing_params: "Invalid callback parameters",
				connection_failed: "Failed to connect calendar",
				insufficient_permission:
					"Insufficient permissions. Please ensure Google Calendar API is enabled in your Google Cloud Console.",
				no_calendar: "No primary calendar found in your Google account",
				invalid_grant: "Invalid authorization grant. Please try connecting again.",
				no_company: "No company selected. Please select a company first.",
			};
			toast.error(errorMessages[error] || "Calendar connection failed");
		}
	});
</script>

{#if loading}
	<div class="flex h-64 items-center justify-center">
		<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
	</div>
{:else}
	<!-- Calendar Connection Status -->
	<div class="mb-6 rounded-lg border bg-white p-6 shadow-sm">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-xl font-semibold text-gray-900">Google Calendar Integration</h2>
				<p class="mt-1 text-gray-600">
					{#if isCalendarConnected}
						✅ Connected and ready for scheduling across all companies
					{:else}
						Connect your Google Calendar to enable scheduling
					{/if}
				</p>
			</div>
			<div class="flex items-center gap-3">
				{#if isCalendarConnected}
					<div class="flex items-center text-green-600">
						<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							></path>
						</svg>
						Connected
					</div>
					<form method="POST" action="?/disconnect" use:enhance>
						<Button type="submit" variant="outline" class="text-red-600 hover:text-red-700">
							Disconnect
						</Button>
					</form>
				{:else}
					<a href="/api/calendar/connect">
						<Button class="bg-blue-600 hover:bg-blue-700">Connect Google Calendar</Button>
					</a>
				{/if}
			</div>
		</div>
	</div>

	<!-- Quick Stats -->
	<div class="grid gap-6 md:grid-cols-3">
		<!-- Meeting Types -->
		<div class="rounded-lg border bg-white p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-lg font-medium text-gray-900">Meeting Types</h3>
					<p class="text-3xl font-bold text-blue-600">{meetingTypes.length}</p>
					<p class="text-sm text-gray-500">Active meeting types</p>
				</div>
				<div class="rounded-full bg-blue-100 p-3">
					<svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						></path>
					</svg>
				</div>
			</div>
			<div class="mt-4">
				<a href="/app/calendar/meetings" class="text-sm text-blue-600 hover:text-blue-700">
					Manage meeting types →
				</a>
			</div>
		</div>

		<!-- Availability -->
		<div class="rounded-lg border bg-white p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-lg font-medium text-gray-900">Availability Templates</h3>
					<p class="text-3xl font-bold text-green-600">{availabilityTemplates.length}</p>
					<p class="text-sm text-gray-500">Availability templates</p>
				</div>
				<div class="rounded-full bg-green-100 p-3">
					<svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
				</div>
			</div>
			<div class="mt-4">
				<a href="/app/calendar/availability" class="text-sm text-green-600 hover:text-green-700">
					Manage templates →
				</a>
			</div>
		</div>

		<!-- Bookings -->
		<div class="rounded-lg border bg-white p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-lg font-medium text-gray-900">Bookings</h3>
					<p class="text-3xl font-bold text-purple-600">{upcomingBookings}</p>
					<p class="text-sm text-gray-500">Upcoming bookings</p>
				</div>
				<div class="rounded-full bg-purple-100 p-3">
					<svg
						class="h-6 w-6 text-purple-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						></path>
					</svg>
				</div>
			</div>
			<div class="mt-4">
				<a href="/app/calendar/bookings" class="text-sm text-purple-600 hover:text-purple-700">
					View bookings →
				</a>
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	{#if isCalendarConnected}
		<div class="mt-6 rounded-lg border bg-white p-6 shadow-sm">
			<h3 class="mb-4 text-lg font-medium text-gray-900">Quick Actions</h3>
			<div class="flex flex-wrap gap-3">
				<a href="/app/calendar/meetings">
					<Button class="bg-blue-600 hover:bg-blue-700">Create Meeting Type</Button>
				</a>
				<a href="/app/calendar/availability">
					<Button variant="outline">Manage Templates</Button>
				</a>
				<a href="/app/calendar/bookings">
					<Button variant="outline">View Bookings</Button>
				</a>
			</div>
		</div>
	{/if}
{/if}
