<script lang="ts">
	import { format } from "date-fns";
	import { enhance } from "$app/forms";
	import { page } from "$app/stores";
	import { toast } from "$lib/utils/toast";

	let { data } = $props();

	let loading = $state(false);
	let showCancelModal = $state(false);
	let showRejectModal = $state(false);
	let selectedBooking = $state(null);

	function formatDateTime(date) {
		return format(new Date(date), "PPP 'at' p");
	}

	function formatDuration(minutes) {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}

	function getStatusColor(status) {
		switch (status) {
			case "confirmed":
				return "bg-green-100 text-green-800";
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			case "rejected":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	}

	const handleEnhance = () => {
		loading = true;
		return async ({ result, update }) => {
			await update();
			loading = false;

			// Show toast notifications based on result
			if (result.type === "success" && result.data?.success) {
				if (result.data.message) {
					toast.success(result.data.message);
				}
				// Close modals on success
				showCancelModal = false;
				showRejectModal = false;
				selectedBooking = null;
			} else if (result.type === "failure" && result.data?.error) {
				toast.error(result.data.error);
			}
		};
	};

	// Show confirmation dialog for cancellation
	function showCancelConfirmation(booking) {
		selectedBooking = booking;
		showCancelModal = true;
	}

	// Show confirmation dialog for rejection
	function showRejectConfirmation(booking) {
		selectedBooking = booking;
		showRejectModal = true;
	}

	// Close modals
	function closeCancelModal() {
		showCancelModal = false;
		selectedBooking = null;
	}

	function closeRejectModal() {
		showRejectModal = false;
		selectedBooking = null;
	}
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

	<!-- Bookings List -->
	{#if data.bookings && data.bookings.length > 0}
		<div class="space-y-4">
			{#each data.bookings as booking}
				<div class="rounded-lg border bg-white p-6 shadow-sm">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="mb-2 flex items-center gap-3">
								<h3 class="text-lg font-semibold text-gray-900">{booking.meetingType.name}</h3>
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(
										booking.status
									)}"
								>
									{booking.status}
								</span>
							</div>

							<div class="space-y-2 text-sm text-gray-600">
								<div class="flex items-center gap-2">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
									<span>{formatDateTime(booking.startTime)}</span>
									<span class="text-gray-400">•</span>
									<span>{formatDuration(booking.meetingType.duration)}</span>
								</div>

								<div class="flex items-center gap-2">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										></path>
									</svg>
									<span>{booking.guestName}</span>
									<span class="text-gray-400">•</span>
									<span>{booking.guestEmail}</span>
								</div>

								{#if booking.guestPhone}
									<div class="flex items-center gap-2">
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
											></path>
										</svg>
										<span>{booking.guestPhone}</span>
									</div>
								{/if}

								{#if booking.guestNotes}
									<div class="flex items-start gap-2">
										<svg
											class="mt-0.5 h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
											></path>
										</svg>
										<span class="text-gray-500">{booking.guestNotes}</span>
									</div>
								{/if}

								{#if booking.cancellationReason && (booking.status === "cancelled" || booking.status === "rejected")}
									<div class="flex items-start gap-2">
										<svg
											class="mt-0.5 h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
											></path>
										</svg>
										<span class="font-medium text-red-600">{booking.cancellationReason}</span>
									</div>
								{/if}
							</div>
						</div>

						<div class="flex items-center gap-2">
							{#if booking.status === "pending"}
								<!-- Approve Button -->
								<form method="POST" action="?/approve" use:enhance={handleEnhance}>
									<input type="hidden" name="bookingId" value={booking.id} />
									<button
										type="submit"
										disabled={loading}
										class="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
									>
										{loading ? "Approving..." : "Approve"}
									</button>
								</form>

								<!-- Reject Button -->
								<button
									type="button"
									disabled={loading}
									class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
									on:click={() => showRejectConfirmation(booking)}
								>
									Reject
								</button>
							{:else if booking.status === "confirmed"}
								<!-- Cancel Button -->
								<button
									type="button"
									disabled={loading}
									class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
									on:click={() => showCancelConfirmation(booking)}
								>
									Cancel
								</button>

								<!-- Debug Button (only show if no calendar event) -->
								{#if !booking.googleEventId}
									<form method="POST" action="?/debug" use:enhance={handleEnhance}>
										<input type="hidden" name="bookingId" value={booking.id} />
										<button
											type="submit"
											disabled={loading}
											class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
										>
											{loading ? "Debugging..." : "Debug"}
										</button>
									</form>
								{/if}
							{/if}

							{#if booking.googleEventId}
								<div class="flex items-center gap-1 text-xs text-green-600">
									<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clip-rule="evenodd"
										></path>
									</svg>
									<span>In Calendar</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
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
			<h3 class="text-lg font-medium text-gray-900">No bookings yet</h3>
			<p class="mt-2 text-gray-500">When people book meetings with you, they'll appear here.</p>
		</div>
	{/if}
</div>

<!-- Cancel Confirmation Modal -->
{#if showCancelModal && selectedBooking}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<h3 class="mb-2 text-lg font-medium text-gray-900">Cancel Booking</h3>
			<p class="mb-4 text-sm text-gray-600">
				Are you sure you want to cancel the booking with {selectedBooking.guestName} for "{selectedBooking
					.meetingType.name}"? This action cannot be undone.
			</p>
			<div class="flex items-center justify-end space-x-3">
				<button
					type="button"
					on:click={closeCancelModal}
					disabled={loading}
					class="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
				>
					Cancel
				</button>
				<form method="POST" action="?/cancel" use:enhance={handleEnhance} class="inline">
					<input type="hidden" name="bookingId" value={selectedBooking.id} />
					<input type="hidden" name="reason" value="Cancelled by host" />
					<button
						type="submit"
						disabled={loading}
						class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
					>
						{loading ? "Cancelling..." : "Cancel Booking"}
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Reject Confirmation Modal -->
{#if showRejectModal && selectedBooking}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<h3 class="mb-2 text-lg font-medium text-gray-900">Reject Booking</h3>
			<p class="mb-4 text-sm text-gray-600">
				Are you sure you want to reject the booking request from {selectedBooking.guestName} for "{selectedBooking
					.meetingType.name}"?
			</p>
			<div class="flex items-center justify-end space-x-3">
				<button
					type="button"
					on:click={closeRejectModal}
					disabled={loading}
					class="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
				>
					Cancel
				</button>
				<form method="POST" action="?/reject" use:enhance={handleEnhance} class="inline">
					<input type="hidden" name="bookingId" value={selectedBooking.id} />
					<input type="hidden" name="reason" value="Rejected by host" />
					<button
						type="submit"
						disabled={loading}
						class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
					>
						{loading ? "Rejecting..." : "Reject Booking"}
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
