<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { toast } from "$lib/utils/toast";
	import Button from "$lib/components/ui/button/button.svelte";

	let isCalendarConnected = $state(false);
	let meetingTypes = $state([]);
	let availability = $state([]);
	let upcomingBookings = $state([]);
	let loading = $state(true);
	let calendarIntegration = $state(null);
	let availableCalendars = $state([]);
	let showCalendarSelector = $state(false);
	let loadingCalendars = $state(false);

	// Meeting type form
	let showMeetingTypeForm = $state(false);
	let meetingTypeForm = $state({
		name: "",
		description: "",
		duration: 30,
		price: 0,
		color: "#3b82f6",
		requiresConfirmation: false,
		bufferTimeBefore: 0,
		bufferTimeAfter: 0,
	});

	// Availability form
	let showAvailabilityForm = $state(false);
	let availabilityForm = $state([
		{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", enabled: true }, // Monday
		{ dayOfWeek: 2, startTime: "09:00", endTime: "17:00", enabled: true }, // Tuesday
		{ dayOfWeek: 3, startTime: "09:00", endTime: "17:00", enabled: true }, // Wednesday
		{ dayOfWeek: 4, startTime: "09:00", endTime: "17:00", enabled: true }, // Thursday
		{ dayOfWeek: 5, startTime: "09:00", endTime: "17:00", enabled: true }, // Friday
		{ dayOfWeek: 6, startTime: "09:00", endTime: "17:00", enabled: false }, // Saturday
		{ dayOfWeek: 0, startTime: "09:00", endTime: "17:00", enabled: false }, // Sunday
	]);

	const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

	onMount(async () => {
		// Check for connection status from URL params
		const connected = $page.url.searchParams.get("connected");
		const error = $page.url.searchParams.get("error");

		if (connected) {
			toast.success("Calendar connected successfully!");
		} else if (error) {
			const errorMessages = {
				access_denied: "Calendar connection was denied",
				missing_params: "Invalid callback parameters",
				connection_failed: "Failed to connect calendar",
				insufficient_permission:
					"Insufficient permissions. Please ensure Google Calendar API is enabled in your Google Cloud Console.",
				no_calendar: "No primary calendar found in your Google account",
				invalid_grant: "Invalid authorization grant. Please try connecting again.",
			};
			toast.error(errorMessages[error] || "Calendar connection failed");
		}

		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			// Load all data in parallel
			const [meetingTypesRes, availabilityRes, calendarStatusRes] = await Promise.all([
				fetch("/api/scheduling/meeting-types"),
				fetch("/api/scheduling/availability"),
				fetch("/api/calendar/status"),
			]);

			if (meetingTypesRes.ok) {
				const data = await meetingTypesRes.json();
				meetingTypes = data.meetingTypes || [];
			}

			if (availabilityRes.ok) {
				const data = await availabilityRes.json();
				availability = data.availability || [];
				updateAvailabilityForm();
			}

			if (calendarStatusRes.ok) {
				const data = await calendarStatusRes.json();
				isCalendarConnected = data.isConnected;
				calendarIntegration = data.integration;
				availableCalendars = [];
			}
		} catch (error) {
			console.error("Error loading data:", error);
			toast.error("Failed to load calendar data");
		} finally {
			loading = false;
		}
	}

	function updateAvailabilityForm() {
		// Update form with existing availability
		availability.forEach((avail) => {
			const formDay = availabilityForm.find((f) => f.dayOfWeek === avail.dayOfWeek);
			if (formDay) {
				formDay.startTime = avail.startTime;
				formDay.endTime = avail.endTime;
				formDay.enabled = true;
			}
		});
	}

	function connectCalendar() {
		window.location.href = "/api/calendar/connect";
	}

	async function disconnectCalendar() {
		try {
			const response = await fetch("/api/calendar/disconnect", {
				method: "POST",
			});

			if (response.ok) {
				isCalendarConnected = false;
				calendarIntegration = null;
				availableCalendars = [];
				toast.success("Calendar disconnected successfully!");
			} else {
				toast.error("Failed to disconnect calendar");
			}
		} catch (error) {
			console.error("Error disconnecting calendar:", error);
			toast.error("Failed to disconnect calendar");
		}
	}

	async function selectCalendar(calendarId) {
		try {
			const response = await fetch("/api/calendar/select", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ calendarId }),
			});

			if (response.ok) {
				const data = await response.json();
				calendarIntegration = data.integration;
				showCalendarSelector = false;
				toast.success("Calendar selected successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to select calendar");
			}
		} catch (error) {
			console.error("Error selecting calendar:", error);
			toast.error("Failed to select calendar");
		}
	}

	function handleShowCalendarSelector() {
		showCalendarSelector = true;
		// Load available calendars when user wants to change calendar
		loadAvailableCalendars();
	}

	async function loadAvailableCalendars() {
		loadingCalendars = true;
		try {
			const response = await fetch("/api/calendar/calendars");
			if (response.ok) {
				const data = await response.json();
				availableCalendars = data.availableCalendars || [];
			} else {
				toast.error("Failed to load available calendars");
			}
		} catch (error) {
			console.error("Error loading available calendars:", error);
			toast.error("Failed to load available calendars");
		} finally {
			loadingCalendars = false;
		}
	}

	function handleCalendarSelectorCancel() {
		showCalendarSelector = false;
	}

	function handleCalendarSelect(event) {
		const calendarId = event.currentTarget.dataset.calendarId;
		selectCalendar(calendarId);
	}

	async function createMeetingType() {
		try {
			const response = await fetch("/api/scheduling/meeting-types", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(meetingTypeForm),
			});

			if (response.ok) {
				const data = await response.json();
				meetingTypes = [...meetingTypes, data.meetingType];
				showMeetingTypeForm = false;
				resetMeetingTypeForm();
				toast.success("Meeting type created successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to create meeting type");
			}
		} catch (error) {
			console.error("Error creating meeting type:", error);
			toast.error("Failed to create meeting type");
		}
	}

	async function saveAvailability() {
		try {
			const availabilityData = availabilityForm
				.filter((day) => day.enabled)
				.map((day) => ({
					dayOfWeek: day.dayOfWeek,
					startTime: day.startTime,
					endTime: day.endTime,
				}));

			const response = await fetch("/api/scheduling/availability", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ availability: availabilityData }),
			});

			if (response.ok) {
				showAvailabilityForm = false;
				await loadData();
				toast.success("Availability updated successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to update availability");
			}
		} catch (error) {
			console.error("Error saving availability:", error);
			toast.error("Failed to save availability");
		}
	}

	function handleMeetingTypeSubmit(event) {
		event.preventDefault();
		createMeetingType();
	}

	function handleAvailabilitySubmit(event) {
		event.preventDefault();
		saveAvailability();
	}

	function resetMeetingTypeForm() {
		meetingTypeForm = {
			name: "",
			description: "",
			duration: 30,
			price: 0,
			color: "#3b82f6",
			requiresConfirmation: false,
			bufferTimeBefore: 0,
			bufferTimeAfter: 0,
		};
	}

	function formatDuration(minutes) {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}

	function formatPrice(cents) {
		if (cents === 0) return "Free";
		return `$${(cents / 100).toFixed(2)}`;
	}

	function handleMeetingTypeFormCancel() {
		showMeetingTypeForm = false;
		resetMeetingTypeForm();
	}

	function handleAvailabilityFormCancel() {
		showAvailabilityForm = false;
	}

	function handleShowMeetingTypeForm() {
		showMeetingTypeForm = true;
	}

	function handleShowAvailabilityForm() {
		showAvailabilityForm = true;
	}
</script>

<div class="p-6">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Calendar & Scheduling</h1>
		<p class="mt-2 text-gray-600">
			Manage your calendar integration, meeting types, and availability
		</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
		</div>
	{:else}
		<!-- Calendar Connection Status -->
		<div class="mb-6 rounded-lg border bg-white p-6 shadow-sm">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div class="min-w-0 flex-1">
					<h2 class="text-xl font-semibold text-gray-900">Google Calendar</h2>
					<p class="mt-1 break-words text-gray-600">
						{#if isCalendarConnected && calendarIntegration}
							Connected to: <span class="font-medium"
								>{calendarIntegration.selectedCalendarName ||
									calendarIntegration.selectedCalendarId}</span
							>
						{:else if isCalendarConnected}
							Your Google Calendar is connected and ready for scheduling
						{:else}
							Connect your Google Calendar to enable scheduling
						{/if}
					</p>
				</div>
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
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
						<div class="flex flex-col gap-2 sm:flex-row">
							<Button
								onclick={handleShowCalendarSelector}
								variant="outline"
								class="w-full sm:w-auto">Change Calendar</Button
							>
							<Button
								onclick={disconnectCalendar}
								variant="outline"
								class="w-full text-red-600 hover:text-red-700 sm:w-auto"
							>
								Disconnect
							</Button>
						</div>
					{:else}
						<Button
							onclick={connectCalendar}
							class="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto"
						>
							Connect Google Calendar
						</Button>
					{/if}
				</div>
			</div>
		</div>

		<!-- Meeting Types -->
		<div class="mb-6 rounded-lg border bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">Meeting Types</h2>
				<Button
					onclick={handleShowMeetingTypeForm}
					disabled={!isCalendarConnected}
					class="bg-blue-600 hover:bg-blue-700"
				>
					Add Meeting Type
				</Button>
			</div>

			{#if meetingTypes.length === 0}
				<div class="py-8 text-center text-gray-500">
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
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						></path>
					</svg>
					<p>No meeting types created yet</p>
					<p class="text-sm">Create your first meeting type to start accepting bookings</p>
				</div>
			{:else}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each meetingTypes as meetingType}
						<div class="rounded-lg border p-4 transition-shadow hover:shadow-md">
							<div class="mb-2 flex items-start justify-between">
								<div class="flex items-center">
									<div
										class="mr-3 h-3 w-3 rounded-full"
										style:background-color={meetingType.color}
									></div>
									<h3 class="font-medium text-gray-900">{meetingType.name}</h3>
								</div>
								<span class="text-sm text-gray-500">{formatPrice(meetingType.price)}</span>
							</div>
							{#if meetingType.description}
								<p class="mb-3 text-sm text-gray-600">{meetingType.description}</p>
							{/if}
							<div class="flex items-center justify-between text-sm text-gray-500">
								<span>{formatDuration(meetingType.duration)}</span>
								{#if meetingType.requiresConfirmation}
									<span class="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
										Requires confirmation
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Availability -->
		<div class="rounded-lg border bg-white p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">Availability</h2>
				<Button
					onclick={handleShowAvailabilityForm}
					disabled={!isCalendarConnected}
					variant="outline"
				>
					Edit Availability
				</Button>
			</div>

			{#if availability.length === 0}
				<div class="py-8 text-center text-gray-500">
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
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<p>No availability set</p>
					<p class="text-sm">Set your availability to allow bookings</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each availability as avail}
						<div
							class="flex items-center justify-between border-b border-gray-100 py-2 last:border-b-0"
						>
							<span class="font-medium text-gray-900">{dayNames[avail.dayOfWeek]}</span>
							<span class="text-gray-600">{avail.startTime} - {avail.endTime}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Meeting Type Form Modal -->
{#if showMeetingTypeForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
		<div class="w-full max-w-md rounded-lg bg-white p-6">
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Create Meeting Type</h3>

			<form onsubmit={handleMeetingTypeSubmit} class="space-y-4">
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">Name</label>
					<input
						type="text"
						bind:value={meetingTypeForm.name}
						required
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="30 Minute Meeting"
					/>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">Description</label>
					<textarea
						bind:value={meetingTypeForm.description}
						rows="3"
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Brief description of the meeting"
					></textarea>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Duration (minutes)</label>
						<input
							type="number"
							bind:value={meetingTypeForm.duration}
							min="15"
							max="480"
							step="15"
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700">Price (cents)</label>
						<input
							type="number"
							bind:value={meetingTypeForm.price}
							min="0"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="0 for free"
						/>
					</div>
				</div>

				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">Color</label>
					<input
						type="color"
						bind:value={meetingTypeForm.color}
						class="h-10 w-full rounded-md border border-gray-300"
					/>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						bind:checked={meetingTypeForm.requiresConfirmation}
						id="requiresConfirmation"
						class="mr-2"
					/>
					<label for="requiresConfirmation" class="text-sm text-gray-700">
						Requires confirmation before booking
					</label>
				</div>

				<div class="flex justify-end gap-3 pt-4">
					<Button type="button" variant="outline" onclick={handleMeetingTypeFormCancel}>
						Cancel
					</Button>
					<Button type="submit" class="bg-blue-600 hover:bg-blue-700">Create Meeting Type</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Availability Form Modal -->
{#if showAvailabilityForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
		<div class="w-full max-w-lg rounded-lg bg-white p-6">
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Set Availability</h3>

			<form onsubmit={handleAvailabilitySubmit} class="space-y-4">
				{#each availabilityForm as day}
					<div class="flex items-center gap-4">
						<div class="w-20">
							<input
								type="checkbox"
								bind:checked={day.enabled}
								id="day-{day.dayOfWeek}"
								class="mr-2"
							/>
							<label for="day-{day.dayOfWeek}" class="text-sm font-medium text-gray-700">
								{dayNames[day.dayOfWeek].slice(0, 3)}
							</label>
						</div>

						{#if day.enabled}
							<div class="flex flex-1 items-center gap-2">
								<input
									type="time"
									bind:value={day.startTime}
									class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<span class="text-gray-500">to</span>
								<input
									type="time"
									bind:value={day.endTime}
									class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
						{:else}
							<div class="flex-1 text-sm text-gray-400">Unavailable</div>
						{/if}
					</div>
				{/each}

				<div class="flex justify-end gap-3 pt-4">
					<Button type="button" variant="outline" onclick={handleAvailabilityFormCancel}>
						Cancel
					</Button>
					<Button type="submit" class="bg-blue-600 hover:bg-blue-700">Save Availability</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Calendar Selector Modal -->
{#if showCalendarSelector}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
		<div class="w-full max-w-md rounded-lg bg-white p-6">
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Select Calendar</h3>
			<p class="mb-4 text-gray-600">Choose which calendar to use for your bookings:</p>

			{#if loadingCalendars}
				<div class="flex items-center justify-center py-8">
					<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
					<span class="ml-2 text-gray-600">Loading calendars...</span>
				</div>
			{:else if availableCalendars.length === 0}
				<div class="py-8 text-center text-gray-500">
					<p>No calendars found</p>
					<p class="text-sm">Make sure you have calendars in your Google account</p>
				</div>
			{:else}
				<div class="max-h-60 space-y-2 overflow-y-auto">
					{#each availableCalendars as calendar}
						<button
							onclick={handleCalendarSelect}
							data-calendar-id={calendar.id}
							class="w-full rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
							class:bg-blue-50={calendarIntegration?.selectedCalendarId === calendar.id}
							class:border-blue-200={calendarIntegration?.selectedCalendarId === calendar.id}
						>
							<div class="font-medium text-gray-900">{calendar.summary}</div>
							{#if calendar.description}
								<div class="text-sm text-gray-600">{calendar.description}</div>
							{/if}
							<div class="mt-1 text-xs text-gray-500">
								{calendar.id}
								{#if calendar.primary}
									<span class="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-blue-800"
										>Primary</span
									>
								{/if}
								{#if calendarIntegration?.selectedCalendarId === calendar.id}
									<span class="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-green-800"
										>Selected</span
									>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			{/if}

			<div class="mt-4 flex justify-end gap-3 border-t pt-4">
				<Button type="button" variant="outline" onclick={handleCalendarSelectorCancel}>
					Cancel
				</Button>
			</div>
		</div>
	</div>
{/if}
