<script>
	import { enhance } from "$app/forms";

	let {
		booking,
		position,
		onClose,
		onOpenNoteModal,
		onShowRejectConfirmation,
		onShowCancelConfirmation,
		handleEnhance,
		onTooltipMouseEnter,
		onTooltipMouseLeave,
	} = $props();

	function formatDateTime(dateTime) {
		const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
		return date.toLocaleString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	}

	function handleNoteClick() {
		onOpenNoteModal(booking);
		onClose();
	}

	function handleRejectClick() {
		onShowRejectConfirmation(booking);
		onClose();
	}

	function handleCancelClick() {
		onShowCancelConfirmation(booking);
		onClose();
	}
</script>

<div
	class="fixed z-[9999] w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-xl"
	style="left: {position.x + 10}px; top: {position.y - 10}px;"
	onmouseenter={onTooltipMouseEnter}
	onmouseleave={onTooltipMouseLeave}
>
	<div class="space-y-3 text-sm">
		<!-- Meeting Type & Duration -->
		<div>
			<div class="font-semibold text-gray-900">{booking.meetingType.name}</div>
			<div class="text-gray-600">{formatDateTime(booking.startTime)}</div>
			<div class="text-gray-600">{booking.meetingType.duration}m duration</div>
		</div>

		<!-- Guest Information -->
		<div class="border-t border-gray-200 pt-3">
			<div class="font-medium text-gray-900">Guest Details</div>
			<div class="select-text text-gray-700">{booking.guestName}</div>
			<div class="select-text text-gray-600">{booking.guestEmail}</div>
			{#if booking.guestPhone}
				<div class="select-text text-gray-600">{booking.guestPhone}</div>
			{/if}
		</div>

		<!-- Guest Notes -->
		{#if booking.guestNotes}
			<div class="border-t border-gray-200 pt-3">
				<div class="font-medium text-gray-900">Guest Message</div>
				<div class="select-text text-xs text-gray-700">{booking.guestNotes}</div>
			</div>
		{/if}

		<!-- Host Notes -->
		{#if booking.hostNotes}
			<div class="border-t border-gray-200 pt-3">
				<div class="font-medium text-blue-700">Your Note</div>
				<div class="select-text text-xs text-blue-600">{booking.hostNotes}</div>
			</div>
		{/if}

		<!-- Cancellation/Rejection Reason -->
		{#if (booking.status === "cancelled" || booking.status === "rejected") && booking.cancellationReason}
			<div class="border-t border-gray-200 pt-3">
				<div class="font-medium text-red-700">
					{booking.status === "cancelled" ? "Cancellation" : "Rejection"} Reason
				</div>
				<div class="select-text break-words text-xs text-red-600">{booking.cancellationReason}</div>
			</div>
		{/if}

		<!-- Action Icons -->
		<div class="border-t border-gray-200 pt-3">
			<div class="flex items-center justify-between">
				<div class="text-xs text-gray-500">Quick Actions</div>
				<div class="flex items-center gap-1">
					<!-- Edit Note Icon -->
					<button
						type="button"
						title={booking.hostNotes ? "Edit Note" : "Add Note"}
						onclick={handleNoteClick}
						class="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
							/>
						</svg>
					</button>

					{#if booking.status === "pending"}
						<!-- Approve Icon -->
						<form method="POST" action="?/approve" use:enhance={handleEnhance} class="inline">
							<input type="hidden" name="bookingId" value={booking.id} />
							<button
								type="submit"
								title="Approve"
								class="rounded p-1 text-green-600 hover:bg-green-100 hover:text-green-800"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</button>
						</form>

						<!-- Reject Icon -->
						<button
							type="button"
							title="Reject"
							onclick={handleRejectClick}
							class="rounded p-1 text-red-600 hover:bg-red-100 hover:text-red-800"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					{:else if booking.status === "confirmed"}
						<!-- Cancel Icon -->
						<button
							type="button"
							title="Cancel"
							onclick={handleCancelClick}
							class="rounded p-1 text-red-600 hover:bg-red-100 hover:text-red-800"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
