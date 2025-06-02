<script lang="ts">
	let { data } = $props();
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-semibold text-gray-900">Bookings</h2>
			<p class="text-gray-600">View and manage your upcoming meetings and bookings</p>
		</div>
	</div>

	<!-- Connection Warning -->
	{#if !data.isCalendarConnected}
		<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
			<div class="flex">
				<svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					></path>
				</svg>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-yellow-800">Calendar Not Connected</h3>
					<p class="mt-1 text-sm text-yellow-700">
						You need to connect your Google Calendar to view bookings.
						<a href="/app/calendar" class="font-medium underline">Connect now</a>
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Bookings Content -->
	<div class="rounded-lg border bg-white p-12 text-center">
		<svg
			class="mx-auto mb-4 h-12 w-12 text-gray-300"
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
		<h3 class="text-lg font-medium text-gray-900">Bookings Coming Soon</h3>
		<p class="mt-2 text-gray-500">
			This feature is under development. You'll be able to view and manage all your bookings here.
		</p>
		<div class="mt-6 text-sm text-gray-400">
			<p>Features coming soon:</p>
			<ul class="mt-2 space-y-1">
				<li>• View upcoming meetings</li>
				<li>• Manage booking requests</li>
				<li>• Send meeting reminders</li>
				<li>• Export booking data</li>
			</ul>
		</div>
	</div>
</div>
