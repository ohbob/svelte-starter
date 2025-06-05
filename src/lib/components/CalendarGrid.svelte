<script>
	import { enhance } from "$app/forms";
	import BookingTooltip from "./BookingTooltip.svelte";
	import {
		format,
		startOfMonth,
		endOfMonth,
		eachDayOfInterval,
		isSameMonth,
		startOfWeek,
		endOfWeek,
		isToday,
		parseISO,
	} from "date-fns";

	let {
		currentDate,
		currentView,
		bookings,
		loading,
		onOpenNoteModal,
		onShowRejectConfirmation,
		onShowCancelConfirmation,
		handleEnhance,
	} = $props();

	// Track expanded days for month view
	let expandedDays = $state(new Set());
	let hoveredBooking = $state(null);
	let tooltipPosition = $state({ x: 0, y: 0 });
	let tooltipTimeout = $state(null);
	let isTooltipHovered = $state(false);

	// Calendar days calculation
	let calendarDays = $derived(() => {
		if (currentView === "month") {
			const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
			const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
			return eachDayOfInterval({ start, end });
		} else if (currentView === "week") {
			const start = startOfWeek(currentDate, { weekStartsOn: 1 });
			const end = endOfWeek(currentDate, { weekStartsOn: 1 });
			return eachDayOfInterval({ start, end });
		}
		return [];
	});

	// Group bookings by date
	let bookingsByDate = $derived(() => {
		const grouped = new Map();
		bookings.forEach((booking) => {
			const date =
				booking.startTime instanceof Date ? booking.startTime : parseISO(booking.startTime);
			const dateKey = format(date, "yyyy-MM-dd");
			if (!grouped.has(dateKey)) {
				grouped.set(dateKey, []);
			}
			grouped.get(dateKey).push(booking);
		});
		return grouped;
	});

	// Utility functions
	function formatTime(dateValue) {
		const date = dateValue instanceof Date ? dateValue : parseISO(dateValue);
		return format(date, "h:mm a");
	}

	function formatDateTime(dateValue) {
		const date = dateValue instanceof Date ? dateValue : parseISO(dateValue);
		return format(date, "MMM d, yyyy 'at' h:mm a");
	}

	function formatBookingTitle(booking) {
		let title = `${booking.meetingType.name} - ${formatDateTime(booking.startTime)} with ${booking.guestName}`;
		title += ` | Reservation: ${booking.id}`;

		if (booking.meetingType.location) {
			const locationIcon = booking.meetingType.location.type === "virtual" ? "💻" : "📍";
			title += ` | ${locationIcon} ${booking.meetingType.location.name}`;

			// Add meeting link if available
			if (booking.meetingLink) {
				title += ` | 🔗 ${booking.meetingLink}`;
			}
		} else {
			title += " | No location";
		}

		return title;
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

	function getStatusDot(status) {
		switch (status) {
			case "confirmed":
				return "bg-green-500";
			case "pending":
				return "bg-yellow-500";
			case "cancelled":
				return "bg-red-500";
			case "rejected":
				return "bg-red-500";
			case "completed":
				return "bg-blue-500";
			default:
				return "bg-gray-500";
		}
	}

	function toggleDayExpansion(dateKey) {
		if (expandedDays.has(dateKey)) {
			expandedDays.delete(dateKey);
		} else {
			expandedDays.add(dateKey);
		}
		expandedDays = new Set(expandedDays); // Trigger reactivity
	}

	function handleRejectClick(booking) {
		onShowRejectConfirmation(booking);
		hideTooltip();
	}

	function handleCancelClick(booking) {
		onShowCancelConfirmation(booking);
		hideTooltip();
	}

	function handleNoteClick(booking) {
		onOpenNoteModal(booking);
		hideTooltip();
	}

	function handleToggleExpansion(dateKey) {
		toggleDayExpansion(dateKey);
	}

	function handleBookingMouseEnter(booking, event) {
		// Clear any existing timeout
		if (tooltipTimeout) {
			clearTimeout(tooltipTimeout);
			tooltipTimeout = null;
		}

		hoveredBooking = booking;
		tooltipPosition = { x: event.clientX, y: event.clientY };
		isTooltipHovered = false; // Reset tooltip hover state
	}

	function handleBookingMouseLeave() {
		// Only start hiding if we're not hovering over the tooltip
		tooltipTimeout = setTimeout(() => {
			if (!isTooltipHovered) {
				hoveredBooking = null;
			}
		}, 100); // Short delay to allow moving to tooltip
	}

	function handleTooltipMouseEnter() {
		// Clear timeout when hovering over tooltip
		if (tooltipTimeout) {
			clearTimeout(tooltipTimeout);
			tooltipTimeout = null;
		}
		isTooltipHovered = true;
	}

	function handleTooltipMouseLeave() {
		isTooltipHovered = false;
		// Hide tooltip immediately when leaving it
		hoveredBooking = null;
	}

	// Handler functions for tooltip actions
	function hideTooltip() {
		hoveredBooking = null;
		tooltipTimeout = setTimeout(() => {
			isTooltipHovered = false;
		}, 100);
	}
</script>

<div class="p-4">
	{#if currentView === "month"}
		<!-- Day Headers -->
		<div class="mb-1 grid grid-cols-7 gap-px">
			{#each ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as day}
				<div class="py-1 text-center text-sm font-medium text-gray-500">
					{day}
				</div>
			{/each}
		</div>
		<!-- Calendar Days -->
		<div class="grid grid-cols-7 gap-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
			{#each calendarDays() as day}
				{@const dateKey = format(day, "yyyy-MM-dd")}
				{@const dayBookings = bookingsByDate().get(dateKey) || []}
				{@const isExpanded = expandedDays.has(dateKey)}
				{@const visibleBookings = isExpanded ? dayBookings : dayBookings.slice(0, 2)}
				<div
					class="relative flex flex-col border-b border-r border-gray-200 p-2 {!isSameMonth(
						day,
						currentDate
					)
						? 'bg-gray-50'
						: ''} {isToday(day) ? 'bg-blue-50' : 'bg-white'} {isExpanded && dayBookings.length > 2
						? 'min-h-40'
						: 'min-h-24'}"
					style="overflow: visible;"
				>
					<div
						class="mb-1 text-xs {!isSameMonth(day, currentDate)
							? 'text-gray-400'
							: isToday(day)
								? 'font-semibold text-blue-600'
								: 'text-gray-900'}"
					>
						{format(day, "d")}
					</div>

					{#if dayBookings.length > 0}
						<div class="min-h-0 flex-1 space-y-0.5">
							{#each visibleBookings as booking}
								<div
									class="group relative rounded px-1.5 py-0.5 text-xs {getStatusColor(
										booking.status
									)} cursor-pointer hover:shadow-sm"
									onmouseenter={(e) => handleBookingMouseEnter(booking, e)}
									onmouseleave={handleBookingMouseLeave}
									title={formatBookingTitle(booking)}
								>
									<div class="flex items-center justify-between">
										<div class="flex min-w-0 flex-1 items-center gap-1">
											<div class="h-1 w-1 rounded-full {getStatusDot(booking.status)}"></div>
											<span class="truncate text-xs font-medium"
												>{formatTime(booking.startTime)} {booking.guestName}</span
											>
										</div>

										<!-- Action Icons -->
										<div
											class="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
										>
											{#if booking.status === "pending"}
												<form
													method="POST"
													action="?/approve"
													use:enhance={handleEnhance}
													class="inline"
												>
													<input type="hidden" name="bookingId" value={booking.id} />
													<button
														type="submit"
														title="Approve"
														class="touch-manipulation rounded p-1 text-green-700 hover:bg-green-200"
													>
														<svg
															class="h-4 w-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M5 13l4 4L19 7"
															/>
														</svg>
													</button>
												</form>
												<button
													type="button"
													title="Reject"
													onclick={() => handleRejectClick(booking)}
													class="touch-manipulation rounded p-1 text-red-700 hover:bg-red-200"
												>
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												</button>
											{:else if booking.status === "confirmed"}
												<button
													type="button"
													title="Cancel"
													onclick={() => handleCancelClick(booking)}
													class="touch-manipulation rounded p-1 text-red-700 hover:bg-red-200"
												>
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												</button>
											{/if}
											<button
												type="button"
												title={booking.hostNotes ? "Edit Note" : "Add Note"}
												onclick={() => handleNoteClick(booking)}
												class="touch-manipulation rounded p-1 text-gray-700 hover:bg-gray-200"
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
										</div>
									</div>
								</div>
							{/each}
							{#if dayBookings.length > 2 && !isExpanded}
								<div class="mt-1">
									<button
										type="button"
										onclick={() => handleToggleExpansion(dateKey)}
										class="w-full touch-manipulation rounded px-1.5 py-0.5 text-left text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-800"
									>
										+{dayBookings.length - 2} more
									</button>
								</div>
							{:else if isExpanded && dayBookings.length > 2}
								<div class="mt-1">
									<button
										type="button"
										onclick={() => handleToggleExpansion(dateKey)}
										class="w-full touch-manipulation rounded px-1.5 py-0.5 text-left text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-800"
									>
										Show less
									</button>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else if currentView === "week"}
		<!-- Day Headers -->
		<div class="mb-1 grid grid-cols-7 gap-px">
			{#each calendarDays() as day}
				<div class="py-1 text-center text-sm font-medium text-gray-500">
					<div>{format(day, "EEE")}</div>
					<div class="text-lg {isToday(day) ? 'font-bold text-blue-600' : 'text-gray-900'}">
						{format(day, "d")}
					</div>
				</div>
			{/each}
		</div>
		<!-- Week Days -->
		<div
			class="grid grid-cols-7 gap-px rounded-lg border border-gray-200 bg-gray-200"
			style="height: 500px;"
		>
			{#each calendarDays() as day}
				{@const dateKey = format(day, "yyyy-MM-dd")}
				{@const dayBookings = bookingsByDate().get(dateKey) || []}
				<div class="bg-white p-1.5 {isToday(day) ? 'bg-blue-50' : ''}">
					{#if dayBookings.length > 0}
						<div class="space-y-1">
							{#each dayBookings as booking}
								<div
									class="group relative rounded px-1.5 py-1 text-xs {getStatusColor(
										booking.status
									)} hover:shadow-sm"
									onmouseenter={(e) => handleBookingMouseEnter(booking, e)}
									onmouseleave={handleBookingMouseLeave}
								>
									<div class="mb-1 flex items-center justify-between">
										<div class="flex min-w-0 flex-1 items-center gap-1">
											<div class="h-1.5 w-1.5 rounded-full {getStatusDot(booking.status)}"></div>
											<span class="truncate font-medium"
												>{formatTime(booking.startTime)} {booking.guestName}</span
											>
										</div>

										<!-- Action Icons - Larger for mobile -->
										<div
											class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
										>
											{#if booking.status === "pending"}
												<form
													method="POST"
													action="?/approve"
													use:enhance={handleEnhance}
													class="inline"
												>
													<input type="hidden" name="bookingId" value={booking.id} />
													<button
														type="submit"
														title="Approve"
														class="touch-manipulation rounded p-1.5 text-green-700 hover:bg-green-200"
													>
														<svg
															class="h-4 w-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M5 13l4 4L19 7"
															/>
														</svg>
													</button>
												</form>
												<button
													type="button"
													title="Reject"
													onclick={() => handleRejectClick(booking)}
													class="touch-manipulation rounded p-1.5 text-red-700 hover:bg-red-200"
												>
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												</button>
											{:else if booking.status === "confirmed"}
												<button
													type="button"
													title="Cancel"
													onclick={() => handleCancelClick(booking)}
													class="touch-manipulation rounded p-1.5 text-red-700 hover:bg-red-200"
												>
													<svg
														class="h-4 w-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												</button>
											{/if}
											<button
												type="button"
												title={booking.hostNotes ? "Edit Note" : "Add Note"}
												onclick={() => handleNoteClick(booking)}
												class="touch-manipulation rounded p-1.5 text-gray-700 hover:bg-gray-200"
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
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Global Tooltip -->
{#if hoveredBooking}
	<BookingTooltip
		booking={hoveredBooking}
		position={tooltipPosition}
		onClose={() => (hoveredBooking = null)}
		{onOpenNoteModal}
		{onShowRejectConfirmation}
		{onShowCancelConfirmation}
		{handleEnhance}
		onTooltipMouseEnter={handleTooltipMouseEnter}
		onTooltipMouseLeave={handleTooltipMouseLeave}
	/>
{/if}
