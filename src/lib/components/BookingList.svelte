<script>
	import { enhance } from "$app/forms";
	import { format, parseISO } from "date-fns";

	let {
		bookings = [],
		loading = false,
		onOpenNoteModal,
		onShowRejectConfirmation,
		onShowCancelConfirmation,
		emptyMessage = "No meetings scheduled for the selected period.",
	} = $props();

	// Utility functions
	function formatDateTime(dateValue) {
		const date = dateValue instanceof Date ? dateValue : parseISO(dateValue);
		return format(date, "MMM d, yyyy 'at' h:mm a");
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
			case "completed":
				return "bg-blue-100 text-blue-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	}

	const handleEnhance = () => {
		return async ({ result, update }) => {
			await update();
		};
	};
</script>

{#if bookings.length > 0}
	<div class="grid grid-cols-1 gap-4">
		{#each bookings as booking}
			<div class="rounded-lg border bg-white p-6 shadow-sm">
				<!-- Top row with status tag and action buttons -->
				<div class="mb-4 flex items-center justify-between">
					<span
						class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(
							booking.status
						)}"
					>
						{booking.status}
					</span>

					<div class="flex items-center gap-2">
						<!-- Add/Edit Note Button -->
						<button
							type="button"
							onclick={() => onOpenNoteModal(booking)}
							class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
							title={booking.hostNotes ? "Edit note" : "Add note"}
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</button>
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
								onclick={() => onShowRejectConfirmation(booking)}
							>
								Reject
							</button>
						{:else if booking.status === "confirmed"}
							<!-- Cancel Button -->
							<button
								type="button"
								disabled={loading}
								class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
								onclick={() => onShowCancelConfirmation(booking)}
							>
								Cancel
							</button>
						{/if}
					</div>
				</div>

				<!-- Meeting content -->
				<div>
					<div class="mb-2">
						<h3 class="text-lg font-semibold text-gray-900">{booking.meetingType.name}</h3>
					</div>
					<div class="space-y-2 text-sm text-gray-600">
						<div class="flex items-center gap-2">
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
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
								/>
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
									/>
								</svg>
								<span>{booking.guestPhone}</span>
							</div>
						{/if}
						{#if booking.guestNotes}
							<div class="flex items-start gap-2">
								<svg class="mt-0.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
									/>
								</svg>
								<span class="text-gray-500">{booking.guestNotes}</span>
							</div>
						{/if}
						{#if booking.hostNotes}
							<div class="flex items-start gap-2">
								<svg class="mt-0.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
								<span class="font-medium text-blue-600">Your note: {booking.hostNotes}</span>
							</div>
						{/if}
						{#if booking.cancellationReason && (booking.status === "cancelled" || booking.status === "rejected")}
							<div class="flex items-start gap-2">
								<svg class="mt-0.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
									/>
								</svg>
								<span class="font-medium text-red-600">{booking.cancellationReason}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="py-12 text-center">
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
			/>
		</svg>
		<h3 class="text-lg font-medium text-gray-900">No bookings found</h3>
		<p class="mt-2 text-gray-500">{emptyMessage}</p>
	</div>
{/if}
