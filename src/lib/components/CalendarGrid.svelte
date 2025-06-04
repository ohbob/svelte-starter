<script>
	import { enhance } from "$app/forms";
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
</script>

<div class="p-6">
	{#if currentView === "month"}
		<!-- Day Headers -->
		<div class="mb-2 grid grid-cols-7 gap-px">
			{#each ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as day}
				<div class="py-2 text-center text-sm font-medium text-gray-500">
					{day}
				</div>
			{/each}
		</div>
		<!-- Calendar Days -->
		<div class="grid grid-cols-7 gap-px rounded-lg border border-gray-200 bg-gray-200">
			{#each calendarDays() as day}
				{@const dateKey = format(day, "yyyy-MM-dd")}
				{@const dayBookings = bookingsByDate().get(dateKey) || []}
				<div
					class="min-h-[120px] bg-white p-1.5 {!isSameMonth(day, currentDate)
						? 'bg-gray-50'
						: ''} {isToday(day) ? 'bg-blue-50' : ''}"
				>
					<div
						class="mb-1 text-sm {!isSameMonth(day, currentDate)
							? 'text-gray-400'
							: isToday(day)
								? 'font-semibold text-blue-600'
								: 'text-gray-900'}"
					>
						{format(day, "d")}
					</div>

					{#if dayBookings.length > 0}
						<div class="space-y-1">
							{#each dayBookings as booking}
								<div
									class="group relative rounded px-2 py-1 text-xs {getStatusColor(
										booking.status
									)} hover:shadow-sm"
								>
									<div class="flex items-center justify-between">
										<div class="flex min-w-0 flex-1 items-center gap-1">
											<div class="h-1.5 w-1.5 rounded-full {getStatusDot(booking.status)}"></div>
											<span class="truncate font-medium">{formatTime(booking.startTime)}</span>
										</div>

										<!-- Action Icons -->
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
														class="rounded p-1 text-green-700 hover:bg-green-200"
													>
														<svg
															class="h-3 w-3"
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
													on:click={() => onShowRejectConfirmation(booking)}
													class="rounded p-1 text-red-700 hover:bg-red-200"
												>
													<svg
														class="h-3 w-3"
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
													on:click={() => onShowCancelConfirmation(booking)}
													class="rounded p-1 text-red-700 hover:bg-red-200"
												>
													<svg
														class="h-3 w-3"
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
												on:click={() => onOpenNoteModal(booking)}
												class="rounded p-1 text-gray-700 hover:bg-gray-200"
											>
												<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
											</button>
										</div>
									</div>
									<div class="truncate text-gray-700">{booking.guestName}</div>
									<div class="truncate text-xs text-gray-500">{booking.meetingType.name}</div>

									<!-- Comprehensive Tooltip -->
									<div
										class="absolute bottom-full left-0 z-20 mb-2 hidden w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-xl group-hover:block"
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
												<div class="text-gray-700">{booking.guestName}</div>
												<div class="text-gray-600">{booking.guestEmail}</div>
												{#if booking.guestPhone}
													<div class="text-gray-600">{booking.guestPhone}</div>
												{/if}
											</div>

											<!-- Guest Notes -->
											{#if booking.guestNotes}
												<div class="border-t border-gray-200 pt-3">
													<div class="font-medium text-gray-900">Guest Message</div>
													<div class="text-xs text-gray-700">{booking.guestNotes}</div>
												</div>
											{/if}

											<!-- Host Notes -->
											{#if booking.hostNotes}
												<div class="border-t border-gray-200 pt-3">
													<div class="font-medium text-blue-700">Your Note</div>
													<div class="text-xs text-blue-600">{booking.hostNotes}</div>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else if currentView === "week"}
		<!-- Day Headers -->
		<div class="mb-2 grid grid-cols-7 gap-px">
			{#each calendarDays() as day}
				<div class="py-2 text-center text-sm font-medium text-gray-500">
					<div>{format(day, "EEE")}</div>
					<div class="text-lg {isToday(day) ? 'font-bold text-blue-600' : 'text-gray-900'}">
						{format(day, "d")}
					</div>
				</div>
			{/each}
		</div>
		<!-- Week Days -->
		<div class="grid grid-cols-7 gap-px rounded-lg border border-gray-200 bg-gray-200">
			{#each calendarDays() as day}
				{@const dateKey = format(day, "yyyy-MM-dd")}
				{@const dayBookings = bookingsByDate().get(dateKey) || []}
				<div class="min-h-[200px] bg-white p-2 {isToday(day) ? 'bg-blue-50' : ''}">
					{#if dayBookings.length > 0}
						<div class="space-y-2">
							{#each dayBookings as booking}
								<div
									class="group relative rounded px-2 py-2 text-xs {getStatusColor(
										booking.status
									)} hover:shadow-sm"
								>
									<div class="mb-1 flex items-center justify-between">
										<div class="flex min-w-0 flex-1 items-center gap-1">
											<div class="h-1.5 w-1.5 rounded-full {getStatusDot(booking.status)}"></div>
											<span class="truncate font-medium">{formatTime(booking.startTime)}</span>
										</div>

										<!-- Action Icons -->
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
														class="rounded p-1 text-green-700 hover:bg-green-200"
													>
														<svg
															class="h-3 w-3"
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
													on:click={() => onShowRejectConfirmation(booking)}
													class="rounded p-1 text-red-700 hover:bg-red-200"
												>
													<svg
														class="h-3 w-3"
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
													on:click={() => onShowCancelConfirmation(booking)}
													class="rounded p-1 text-red-700 hover:bg-red-200"
												>
													<svg
														class="h-3 w-3"
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
												on:click={() => onOpenNoteModal(booking)}
												class="rounded p-1 text-gray-700 hover:bg-gray-200"
											>
												<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
													/>
												</svg>
											</button>
										</div>
									</div>
									<div class="truncate text-gray-700">{booking.guestName}</div>
									<div class="truncate text-xs text-gray-500">{booking.meetingType.name}</div>

									<!-- Comprehensive Tooltip -->
									<div
										class="absolute bottom-full left-0 z-20 mb-2 hidden w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-xl group-hover:block"
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
												<div class="text-gray-700">{booking.guestName}</div>
												<div class="text-gray-600">{booking.guestEmail}</div>
												{#if booking.guestPhone}
													<div class="text-gray-600">{booking.guestPhone}</div>
												{/if}
											</div>

											<!-- Guest Notes -->
											{#if booking.guestNotes}
												<div class="border-t border-gray-200 pt-3">
													<div class="font-medium text-gray-900">Guest Message</div>
													<div class="text-xs text-gray-700">{booking.guestNotes}</div>
												</div>
											{/if}

											<!-- Host Notes -->
											{#if booking.hostNotes}
												<div class="border-t border-gray-200 pt-3">
													<div class="font-medium text-blue-700">Your Note</div>
													<div class="text-xs text-blue-600">{booking.hostNotes}</div>
												</div>
											{/if}
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
