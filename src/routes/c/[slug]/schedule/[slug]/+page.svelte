<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { toast } from "$lib/utils/toast";
	import Button from "$lib/components/ui/button/button.svelte";
	import {
		addDays,
		format,
		parseISO,
		startOfDay,
		isSameDay,
		startOfMonth,
		endOfMonth,
		eachDayOfInterval,
		getDay,
	} from "date-fns";

	let { data } = $props();
	let meetingType = $state(data.meetingType);
	let selectedDate = $state(null);
	let selectedSlot = $state(null);
	let availableSlots = $state([]);
	let loading = $state(false);
	let bookingStep = $state("date"); // 'date', 'time', 'details', 'confirmation'
	let loadingAvailability = $state(false);

	// Booking form
	let bookingForm = $state({
		guestName: "",
		guestEmail: "",
		guestPhone: "",
		guestNotes: "",
	});

	// Calendar data
	let currentMonth = $state(new Date());
	let calendarDays = $state([]);
	let dateAvailability = $state(new Map()); // Map<dateString, { hasSlots: boolean, slotsCount: number }>

	// Initialize with server-loaded data
	$effect(() => {
		if (data.dateAvailability) {
			dateAvailability = new Map(Object.entries(data.dateAvailability));
		}
	});

	// Generate calendar days when currentMonth changes
	$effect(() => {
		generateCalendarDays();
	});

	function generateCalendarDays() {
		const start = startOfMonth(currentMonth);
		const end = endOfMonth(currentMonth);
		const days = eachDayOfInterval({ start, end });

		// Add padding days from previous month
		const startDay = getDay(start);
		const paddingDays = [];
		for (let i = startDay - 1; i >= 0; i--) {
			paddingDays.push({
				date: addDays(start, -i - 1),
				isCurrentMonth: false,
				isPast: true,
			});
		}

		// Current month days
		const today = startOfDay(new Date());
		const monthDays = days.map((date) => ({
			date,
			isCurrentMonth: true,
			isPast: date < today,
			isToday: isSameDay(date, today),
		}));

		calendarDays = [...paddingDays, ...monthDays];
	}

	async function loadDateAvailability() {
		loadingAvailability = true;

		try {
			// Get all current month dates that aren't in the past
			const today = startOfDay(new Date());
			const datesToCheck = calendarDays
				.filter((day) => day.isCurrentMonth && !day.isPast)
				.map((day) => day.date);

			// For dates not already loaded, we would need to make server requests
			// For now, we'll use the pre-loaded data from the server
			// In a full implementation, you might want to add form actions for loading more dates
		} catch (error) {
			console.error("Error loading date availability:", error);
		} finally {
			loadingAvailability = false;
		}
	}

	function getDateAvailability(date) {
		const dateKey = date.toISOString().split("T")[0];
		return dateAvailability.get(dateKey) || { hasSlots: false, slotsCount: 0 };
	}

	function nextMonth() {
		currentMonth = addDays(currentMonth, 32);
		currentMonth = startOfMonth(currentMonth);
		generateCalendarDays();
		// In a full implementation, you'd load availability for the new month here
	}

	function prevMonth() {
		currentMonth = addDays(currentMonth, -32);
		currentMonth = startOfMonth(currentMonth);
		generateCalendarDays();
		// In a full implementation, you'd load availability for the new month here
	}

	function selectDate(date) {
		const availability = getDateAvailability(date);
		if (!availability.hasSlots) {
			toast.error("No available times on this date");
			return;
		}

		selectedDate = date;
		selectedSlot = null;

		// Use pre-loaded slots if available
		if (availability.slots) {
			availableSlots = availability.slots;
			bookingStep = "time";
		} else {
			// For dates not pre-loaded, you might want to add a form action to load slots
			toast.error("Please refresh the page to load available times");
		}
	}

	function selectSlot(slot) {
		selectedSlot = slot;
		bookingStep = "details";
	}

	async function submitBooking() {
		if (!bookingForm.guestName || !bookingForm.guestEmail) {
			toast.error("Please fill in all required fields");
			return;
		}

		loading = true;

		try {
			const response = await fetch("/api/scheduling/bookings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					meetingTypeId: meetingType.id,
					hostUserId: data.userId,
					guestName: bookingForm.guestName,
					guestEmail: bookingForm.guestEmail,
					guestPhone: bookingForm.guestPhone,
					guestNotes: bookingForm.guestNotes,
					startTime: selectedSlot.start,
				}),
			});

			if (response.ok) {
				bookingStep = "confirmation";
				toast.success("Meeting booked successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to book meeting");
			}
		} catch (error) {
			console.error("Error booking meeting:", error);
			toast.error("Failed to book meeting");
		} finally {
			loading = false;
		}
	}

	function goBack() {
		if (bookingStep === "time") {
			bookingStep = "date";
			selectedDate = null;
		} else if (bookingStep === "details") {
			bookingStep = "time";
			selectedSlot = null;
		}
	}

	function formatTime(dateString) {
		return format(parseISO(dateString), "h:mm a");
	}

	function formatDuration(minutes) {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}

	function handleSlotClick(event) {
		const slotIndex = event.currentTarget.dataset.slotIndex;
		if (slotIndex !== undefined) {
			selectSlot(availableSlots[parseInt(slotIndex)]);
		}
	}

	function handleBookingSubmit(event) {
		event.preventDefault();
		submitBooking();
	}
</script>

<svelte:head>
	<title>Book {meetingType.name} | {data.hostName}</title>
	<meta name="description" content="Book a {meetingType.name} meeting with {data.hostName}" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-6xl">
		<div class="grid min-h-screen lg:grid-cols-2">
			<!-- Left Panel - Meeting Info -->
			<div class="border-r border-gray-200 bg-white p-8 lg:p-12">
				<div class="max-w-md">
					<!-- Back to profile link -->
					<a
						href="/u/{data.username}"
						class="mb-8 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
					>
						<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							></path>
						</svg>
						Back
					</a>

					<!-- Host info -->
					<div class="mb-6">
						<h1 class="mb-1 text-xl font-semibold text-gray-900">{data.hostName}</h1>
						<h2 class="mb-2 text-2xl font-bold text-gray-900">{meetingType.name}</h2>

						<div class="flex items-center gap-4 text-sm text-gray-600">
							<div class="flex items-center gap-1">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
								{formatDuration(meetingType.duration)}
							</div>

							{#if meetingType.price > 0}
								<div class="flex items-center gap-1">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
										></path>
									</svg>
									${(meetingType.price / 100).toFixed(2)}
								</div>
							{:else}
								<span class="font-medium text-green-600">Free</span>
							{/if}
						</div>
					</div>

					{#if meetingType.description}
						<div class="mb-8">
							<p class="leading-relaxed text-gray-600">{meetingType.description}</p>
						</div>
					{/if}

					<!-- Selected booking summary -->
					{#if selectedDate && selectedSlot}
						<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
							<div class="flex items-start gap-3">
								<div
									class="mt-2 h-2 w-2 rounded-full"
									style:background-color={meetingType.color}
								></div>
								<div class="flex-1">
									<div class="font-medium text-gray-900">{meetingType.name}</div>
									<div class="mt-1 text-sm text-gray-600">
										{format(selectedDate, "EEEE, MMMM d, yyyy")}
									</div>
									<div class="text-sm text-gray-600">
										{formatTime(selectedSlot.start)} ({formatDuration(meetingType.duration)})
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Right Panel - Booking Interface -->
			<div class="bg-white p-8 lg:p-12">
				<div class="mx-auto max-w-md">
					{#if bookingStep === "date"}
						<div class="mb-6">
							<h3 class="mb-2 text-lg font-semibold text-gray-900">Select a date</h3>
							<p class="text-sm text-gray-600">Choose a day that works for you</p>
						</div>

						<!-- Calendar Header -->
						<div class="mb-4">
							<div class="mb-4 flex items-center justify-between">
								<button
									onclick={prevMonth}
									class="rounded-lg p-2 transition-colors hover:bg-gray-100"
									disabled={loadingAvailability}
								>
									<svg
										class="h-5 w-5 text-gray-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 19l-7-7 7-7"
										></path>
									</svg>
								</button>

								<h4 class="text-lg font-semibold text-gray-900">
									{format(currentMonth, "MMMM yyyy")}
								</h4>

								<button
									onclick={nextMonth}
									class="rounded-lg p-2 transition-colors hover:bg-gray-100"
									disabled={loadingAvailability}
								>
									<svg
										class="h-5 w-5 text-gray-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										></path>
									</svg>
								</button>
							</div>

							<!-- Day headers -->
							<div class="mb-2 grid grid-cols-7 gap-1">
								{#each ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as day}
									<div class="py-2 text-center text-xs font-medium text-gray-500">
										{day}
									</div>
								{/each}
							</div>
						</div>

						<!-- Calendar Grid -->
						{#if loadingAvailability}
							<div class="flex items-center justify-center py-12">
								<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
							</div>
						{:else}
							<div class="mb-4 grid grid-cols-7 gap-1">
								{#each calendarDays as day}
									{@const availability = getDateAvailability(day.date)}
									{@const isDisabled =
										day.isPast ||
										!day.isCurrentMonth ||
										(!availability.hasSlots && day.isCurrentMonth)}

									<button
										onclick={() => !isDisabled && selectDate(day.date)}
										class="relative aspect-square rounded-lg p-2 text-sm transition-all duration-200
											{day.isCurrentMonth
											? availability.hasSlots
												? 'border border-gray-200 text-gray-900 hover:border-gray-900 hover:bg-gray-900 hover:text-white'
												: 'cursor-not-allowed bg-gray-50 text-gray-400'
											: 'cursor-not-allowed text-gray-300'}
											{day.isToday && day.isCurrentMonth ? 'ring-2 ring-blue-500' : ''}
										"
										disabled={isDisabled}
									>
										<span class="block">{day.date.getDate()}</span>

										{#if day.isCurrentMonth && availability.hasSlots}
											<div class="absolute bottom-1 left-1/2 -translate-x-1/2 transform">
												<div class="h-1 w-1 rounded-full bg-green-500"></div>
											</div>
										{/if}
									</button>
								{/each}
							</div>

							<!-- Legend -->
							<div
								class="mt-4 flex items-center gap-4 border-t border-gray-200 pt-4 text-xs text-gray-600"
							>
								<div class="flex items-center gap-2">
									<div class="h-2 w-2 rounded-full bg-green-500"></div>
									<span>Available</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="h-2 w-2 rounded-full bg-gray-300"></div>
									<span>Unavailable</span>
								</div>
							</div>
						{/if}
					{:else if bookingStep === "time"}
						<div class="mb-6">
							<button
								onclick={goBack}
								class="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
							>
								<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 19l-7-7 7-7"
									></path>
								</svg>
								Back
							</button>

							<h3 class="mb-2 text-lg font-semibold text-gray-900">Select a time</h3>
							<p class="text-sm text-gray-600">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
						</div>

						{#if loading}
							<div class="flex items-center justify-center py-12">
								<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
							</div>
						{:else if availableSlots.length === 0}
							<div class="py-12 text-center">
								<div
									class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
								>
									<svg
										class="h-8 w-8 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
								</div>
								<h4 class="mb-2 text-lg font-medium text-gray-900">No times available</h4>
								<p class="text-sm text-gray-600">Please select a different date</p>
							</div>
						{:else}
							<div class="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto">
								{#each availableSlots as slot, index}
									<button
										onclick={handleSlotClick}
										data-slot-index={index}
										class="rounded-lg border border-gray-200 p-3 text-center font-medium text-gray-900 transition-all duration-200 hover:border-gray-900 hover:bg-gray-50"
									>
										{formatTime(slot.start)}
									</button>
								{/each}
							</div>
						{/if}
					{:else if bookingStep === "details"}
						<div class="mb-6">
							<button
								onclick={goBack}
								class="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
							>
								<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 19l-7-7 7-7"
									></path>
								</svg>
								Back
							</button>

							<h3 class="mb-2 text-lg font-semibold text-gray-900">Enter details</h3>
							<p class="text-sm text-gray-600">We'll send you a confirmation email</p>
						</div>

						<form onsubmit={handleBookingSubmit} class="space-y-4">
							<div>
								<label for="guestName" class="mb-2 block text-sm font-medium text-gray-900"
									>Name *</label
								>
								<input
									id="guestName"
									type="text"
									bind:value={bookingForm.guestName}
									required
									class="w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
									placeholder="Your full name"
								/>
							</div>

							<div>
								<label for="guestEmail" class="mb-2 block text-sm font-medium text-gray-900"
									>Email *</label
								>
								<input
									id="guestEmail"
									type="email"
									bind:value={bookingForm.guestEmail}
									required
									class="w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
									placeholder="your@email.com"
								/>
							</div>

							<div>
								<label for="guestPhone" class="mb-2 block text-sm font-medium text-gray-900"
									>Phone number</label
								>
								<input
									id="guestPhone"
									type="tel"
									bind:value={bookingForm.guestPhone}
									class="w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
									placeholder="Your phone number"
								/>
							</div>

							<div>
								<label for="guestNotes" class="mb-2 block text-sm font-medium text-gray-900"
									>Additional notes</label
								>
								<textarea
									id="guestNotes"
									bind:value={bookingForm.guestNotes}
									rows="3"
									class="w-full resize-none rounded-lg border border-gray-300 px-3 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
									placeholder="Please share anything that will help prepare for our meeting"
								></textarea>
							</div>

							<button
								type="submit"
								class="flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={loading}
							>
								{#if loading}
									<div class="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
								{/if}
								Schedule Event
							</button>
						</form>
					{:else if bookingStep === "confirmation"}
						<div class="text-center">
							<div
								class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
							>
								<svg class="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clip-rule="evenodd"
									></path>
								</svg>
							</div>

							<h3 class="mb-2 text-xl font-semibold text-gray-900">You're scheduled!</h3>
							<p class="mb-8 text-gray-600">
								A calendar invitation has been sent to your email address.
							</p>

							<div class="rounded-lg border border-gray-200 bg-gray-50 p-6 text-left">
								<h4 class="mb-4 font-semibold text-gray-900">Event Details</h4>
								<div class="space-y-3 text-sm">
									<div class="flex justify-between">
										<span class="text-gray-600">What</span>
										<span class="font-medium text-gray-900">{meetingType.name}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-gray-600">When</span>
										<span class="font-medium text-gray-900">
											{format(selectedDate, "MMM d, yyyy")} at {formatTime(selectedSlot.start)}
										</span>
									</div>
									<div class="flex justify-between">
										<span class="text-gray-600">Duration</span>
										<span class="font-medium text-gray-900"
											>{formatDuration(meetingType.duration)}</span
										>
									</div>
									<div class="flex justify-between">
										<span class="text-gray-600">Who</span>
										<span class="font-medium text-gray-900">{data.hostName}</span>
									</div>
								</div>
							</div>

							<div class="mt-8">
								<a
									href="/u/{data.username}"
									class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
								>
									← Back to {data.hostName}'s profile
								</a>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
