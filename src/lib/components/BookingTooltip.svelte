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

	function formatLocationDetails(location, meetingLink) {
		if (!location) return null;

		if (location.type === "virtual") {
			let details = `💻 ${location.name} (Virtual Meeting)`;

			// Show actual meeting link if available, otherwise show the configured link or auto-generation message
			if (meetingLink) {
				details += `\n🔗 ${meetingLink}`;
			} else if (location.customMeetingUrl) {
				details += `\n🔗 ${location.customMeetingUrl}`;
			} else if (location.platform === "google_meet" && location.autoGenerateLink) {
				details += "\n🔗 Google Meet link will be generated automatically";
			}
			return details;
		} else {
			let details = `📍 ${location.name}`;
			if (location.address) {
				details += `\n${location.address}`;
				if (location.city) details += `, ${location.city}`;
				if (location.state) details += `, ${location.state}`;
				if (location.country) details += `, ${location.country}`;
			}
			if (location.phone) {
				details += `\n📞 ${location.phone}`;
			}
			return details;
		}
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

		<!-- Reservation Number -->
		<div class="border-t border-gray-200 pt-3">
			<div class="font-medium text-gray-900">Reservation #</div>
			<div class="select-text font-mono text-xs text-gray-600">{booking.id}</div>
		</div>

		<!-- Location Information -->
		{#if booking.meetingType.location}
			<div class="border-t border-gray-200 pt-3">
				<div class="font-medium text-gray-900">Location</div>
				<div class="select-text whitespace-pre-line text-gray-700">
					{formatLocationDetails(booking.meetingType.location, booking.meetingLink)}
				</div>
			</div>
		{/if}

		<!-- Meeting Link (if available) -->
		{#if booking.meetingLink}
			<div class="border-t border-gray-200 pt-3">
				<div class="font-medium text-gray-900">Meeting Link</div>
				<a
					href={booking.meetingLink}
					target="_blank"
					rel="noopener noreferrer"
					class="select-text break-all text-blue-600 underline hover:text-blue-800"
				>
					{booking.meetingLink}
				</a>
			</div>
		{/if}

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
				<div class="font-medium text-gray-900">Quick Actions</div>
				<div class="flex items-center gap-2">
					<!-- Add/Edit Note Icon -->
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
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
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
