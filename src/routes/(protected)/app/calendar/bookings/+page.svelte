<script lang="ts">
	import { enhance } from "$app/forms";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { toast } from "$lib/utils/toast";
	import BookingList from "$lib/components/BookingList.svelte";
	import CalendarNavigation from "$lib/components/CalendarNavigation.svelte";
	import BookingSearchFilters from "$lib/components/BookingSearchFilters.svelte";
	import CalendarGrid from "$lib/components/CalendarGrid.svelte";
	import { format, parseISO } from "date-fns";

	let { data, form } = $props();

	// View state
	let currentView = $state("month");
	let currentDate = $state(new Date());
	let selectedBooking: any = $state(null);
	let showNoteModal = $state(false);
	let noteText = $state("");

	// Modal states
	let showCancelModal = $state(false);
	let showRejectModal = $state(false);
	let showAddBookingModal = $state(false);
	let loading = $state(false);

	// Search and filters
	let searchQuery = $state(data.searchQuery || "");
	let statusFilter = $state(data.statusFilter || "all");

	// Add booking form data
	let addBookingForm = $state({
		meetingTypeId: "",
		guestName: "",
		guestEmail: "",
		guestPhone: "",
		guestNotes: "",
		hostNotes: "",
		date: "",
		time: "",
		status: "confirmed",
	});

	// Current day's bookings for day view
	let currentDayBookings = $derived(() => {
		const dayKey = format(currentDate, "yyyy-MM-dd");
		return data.bookings.filter((booking: any) => {
			const date =
				booking.startTime instanceof Date ? booking.startTime : parseISO(booking.startTime);
			const dateKey = format(date, "yyyy-MM-dd");
			return dateKey === dayKey;
		});
	});

	// Utility functions
	function formatDuration(minutes: number) {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}

	function goToToday() {
		currentDate = new Date();
	}

	// Modal functions
	function showCancelConfirmation(booking: any) {
		selectedBooking = booking;
		showCancelModal = true;
	}

	function showRejectConfirmation(booking: any) {
		selectedBooking = booking;
		showRejectModal = true;
	}

	function closeCancelModal() {
		showCancelModal = false;
		selectedBooking = null;
	}

	function closeRejectModal() {
		showRejectModal = false;
		selectedBooking = null;
	}

	function openNoteModal(booking: any) {
		selectedBooking = booking;
		noteText = booking.hostNotes || "";
		showNoteModal = true;
	}

	function closeNoteModal() {
		showNoteModal = false;
		selectedBooking = null;
		noteText = "";
	}

	function openAddBookingModal() {
		showAddBookingModal = true;
		resetAddBookingForm();
	}

	function closeAddBookingModal() {
		showAddBookingModal = false;
		resetAddBookingForm();
	}

	function resetAddBookingForm() {
		addBookingForm = {
			meetingTypeId: "",
			guestName: "",
			guestEmail: "",
			guestPhone: "",
			guestNotes: "",
			hostNotes: "",
			date: "",
			time: "",
			status: "confirmed",
		};
	}

	function changePage(pageNum: number) {
		const url = new URL(window.location.href);
		url.searchParams.set("page", pageNum.toString());
		goto(url.toString());
	}

	// Form handlers
	const handleEnhance = () => {
		loading = true;
		return async ({ result, update }: any) => {
			if (result.type === "success") {
				toast.success(result.data?.message || "Action completed successfully!");

				// Close modals based on the action
				if (showAddBookingModal) {
					closeAddBookingModal();
					resetAddBookingForm();
				}
				if (showNoteModal) {
					closeNoteModal();
				}
				if (showCancelModal) {
					closeCancelModal();
				}
				if (showRejectModal) {
					closeRejectModal();
				}
			} else if (result.type === "failure") {
				toast.error(result.data?.error || "Failed to complete action");
			}
			await update();
			loading = false;
		};
	};

	// Handle form results
	$effect(() => {
		if (form?.success) {
			toast.success(form.message || "Action completed successfully!");
		} else if (form?.error) {
			toast.error(form.error);
		}
	});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-2xl font-semibold text-gray-900">Bookings</h2>
			<p class="text-gray-600">View and manage your meetings and bookings</p>
		</div>
		<div class="flex items-center gap-3">
			<!-- Add Booking Button -->
			<button
				type="button"
				onclick={openAddBookingModal}
				class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				<svg class="mr-2 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					/>
				</svg>
				Add Booking
			</button>

			<!-- View Toggle -->
			<div class="flex rounded-lg border border-gray-200 bg-white p-1">
				<button
					type="button"
					onclick={() => (currentView = "month")}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {currentView ===
					'month'
						? 'bg-blue-100 text-blue-700'
						: 'text-gray-500 hover:text-gray-700'}"
				>
					<svg class="mr-1.5 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					Month
				</button>
				<button
					type="button"
					onclick={() => (currentView = "week")}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {currentView ===
					'week'
						? 'bg-blue-100 text-blue-700'
						: 'text-gray-500 hover:text-gray-700'}"
				>
					<svg class="mr-1.5 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					Week
				</button>
				<button
					type="button"
					onclick={() => (currentView = "day")}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {currentView === 'day'
						? 'bg-blue-100 text-blue-700'
						: 'text-gray-500 hover:text-gray-700'}"
				>
					<svg class="mr-1.5 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					Day
				</button>
				<button
					type="button"
					onclick={() => (currentView = "list")}
					class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {currentView ===
					'list'
						? 'bg-blue-100 text-blue-700'
						: 'text-gray-500 hover:text-gray-700'}"
				>
					<svg class="mr-1.5 inline h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 10h16M4 14h16M4 18h16"
						/>
					</svg>
					List
				</button>
			</div>
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

	<!-- Search and Filters -->
	<BookingSearchFilters bind:searchQuery bind:statusFilter />

	<!-- Search Results Indicator -->
	<!-- {#if searchQuery || statusFilter !== "all"}
		<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
			<div class="flex items-center">
				<svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
						clip-rule="evenodd"
					/>
				</svg>
				<div class="ml-3">
					<p class="text-sm text-blue-800">
						{#if currentView === "list"}
							Showing {data.bookings.length} of {data.totalBookings} results
							{#if searchQuery}for "{searchQuery}"{/if}
							{#if statusFilter !== "all"}with status "{statusFilter}"{/if}
						{:else}
							Found {data.totalBookings} total results
							{#if searchQuery}for "{searchQuery}"{/if}
							{#if statusFilter !== "all"}with status "{statusFilter}"{/if}
							- Calendar view shows results within visible date range
						{/if}
					</p>
					{#if currentView !== "list" && data.totalBookings > data.bookings.length}
						<p class="mt-1 text-xs text-blue-600">
							Switch to List view to see all results with pagination
						</p>
					{/if}
				</div>
			</div>
		</div>
	{/if} -->

	<!-- Calendar Views -->
	{#if currentView === "month" || currentView === "week"}
		<div class="rounded-lg border border-gray-200 bg-white">
			<CalendarNavigation bind:currentDate {currentView} onGoToToday={goToToday} />
			<CalendarGrid
				{currentDate}
				{currentView}
				bookings={data.bookings}
				{loading}
				onOpenNoteModal={openNoteModal}
				onShowRejectConfirmation={showRejectConfirmation}
				onShowCancelConfirmation={showCancelConfirmation}
				{handleEnhance}
			/>
		</div>
	{:else if currentView === "day"}
		<div class="rounded-lg border border-gray-200 bg-white">
			<CalendarNavigation bind:currentDate {currentView} onGoToToday={goToToday} />
			<div class="p-6">
				<BookingList
					bookings={currentDayBookings()}
					{loading}
					onOpenNoteModal={openNoteModal}
					onShowRejectConfirmation={showRejectConfirmation}
					onShowCancelConfirmation={showCancelConfirmation}
					emptyMessage="No meetings scheduled for {format(currentDate, 'MMMM d, yyyy')}"
				/>
			</div>
		</div>
	{:else if currentView === "list"}
		<BookingList
			bookings={data.bookings}
			{loading}
			onOpenNoteModal={openNoteModal}
			onShowRejectConfirmation={showRejectConfirmation}
			onShowCancelConfirmation={showCancelConfirmation}
			emptyMessage={searchQuery || statusFilter !== "all"
				? "No bookings found matching your search criteria."
				: "When people book meetings with you, they'll appear here."}
		/>

		<!-- Pagination -->
		{#if data.totalPages > 1}
			<div
				class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
			>
				<div class="flex flex-1 justify-between sm:hidden">
					<button
						type="button"
						onclick={() => changePage(data.currentPage - 1)}
						disabled={data.currentPage <= 1}
						class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
					>
						Previous
					</button>
					<button
						type="button"
						onclick={() => changePage(data.currentPage + 1)}
						disabled={data.currentPage >= data.totalPages}
						class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
					>
						Next
					</button>
				</div>
				<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
					<div>
						<p class="text-sm text-gray-700">
							Showing <span class="font-medium">{(data.currentPage - 1) * 10 + 1}</span> to
							<span class="font-medium">{Math.min(data.currentPage * 10, data.totalBookings)}</span>
							of
							<span class="font-medium">{data.totalBookings}</span> results
						</p>
					</div>
					<div>
						<nav
							class="isolate inline-flex -space-x-px rounded-md shadow-sm"
							aria-label="Pagination"
						>
							<button
								type="button"
								onclick={() => changePage(data.currentPage - 1)}
								disabled={data.currentPage <= 1}
								class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
							>
								<span class="sr-only">Previous</span>
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										fill-rule="evenodd"
										d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>

							{#each Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => i + Math.max(1, data.currentPage - 2)) as pageNum}
								{#if pageNum <= data.totalPages}
									<button
										type="button"
										onclick={() => changePage(pageNum)}
										class="relative inline-flex items-center px-4 py-2 text-sm font-semibold {pageNum ===
										data.currentPage
											? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
											: 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}"
									>
										{pageNum}
									</button>
								{/if}
							{/each}

							<button
								type="button"
								onclick={() => changePage(data.currentPage + 1)}
								disabled={data.currentPage >= data.totalPages}
								class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
							>
								<span class="sr-only">Next</span>
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										fill-rule="evenodd"
										d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						</nav>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Note Modal -->
{#if showNoteModal && selectedBooking}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<h3 class="mb-4 text-lg font-medium text-gray-900">
				{selectedBooking.hostNotes ? "Edit Note" : "Add Note"}
			</h3>
			<form method="POST" action="?/addNote" use:enhance={handleEnhance}>
				<input type="hidden" name="bookingId" value={selectedBooking.id} />
				<div class="mb-4">
					<label for="note" class="mb-2 block text-sm font-medium text-gray-700">
						Private note about this booking
					</label>
					<textarea
						id="note"
						name="note"
						rows="4"
						bind:value={noteText}
						placeholder="Add your private notes about this booking..."
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					></textarea>
				</div>
				<div class="flex items-center justify-end space-x-3">
					<button
						type="button"
						onclick={closeNoteModal}
						disabled={loading}
						class="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading || !noteText.trim()}
						class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
					>
						{loading ? "Saving..." : "Save Note"}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

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
					onclick={closeCancelModal}
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
			<form method="POST" action="?/reject" use:enhance={handleEnhance}>
				<input type="hidden" name="bookingId" value={selectedBooking.id} />
				<div class="mb-4">
					<label for="rejectReason" class="mb-2 block text-sm font-medium text-gray-700">
						Reason for rejection (optional)
					</label>
					<textarea
						id="rejectReason"
						name="reason"
						rows="3"
						placeholder="Provide a reason for rejecting this booking..."
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					></textarea>
				</div>
				<div class="flex items-center justify-end space-x-3">
					<button
						type="button"
						onclick={closeRejectModal}
						disabled={loading}
						class="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading}
						class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
					>
						{loading ? "Rejecting..." : "Reject Booking"}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Add Booking Modal -->
{#if showAddBookingModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
			<h3 class="mb-4 text-lg font-medium text-gray-900">Add Booking Manually</h3>
			<form method="POST" action="?/addBooking" use:enhance={handleEnhance}>
				<div class="mb-4">
					<label for="meetingTypeId" class="mb-2 block text-sm font-medium text-gray-700">
						Meeting Type *
					</label>
					<select
						id="meetingTypeId"
						name="meetingTypeId"
						bind:value={addBookingForm.meetingTypeId}
						required
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					>
						<option value="">Select a meeting type</option>
						{#each data.meetingTypes as meetingType}
							<option value={meetingType.id}
								>{meetingType.name} ({formatDuration(meetingType.duration)})</option
							>
						{/each}
					</select>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<label for="guestName" class="mb-2 block text-sm font-medium text-gray-700">
							Guest Name *
						</label>
						<input
							id="guestName"
							name="guestName"
							type="text"
							bind:value={addBookingForm.guestName}
							placeholder="Enter guest name"
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label for="guestEmail" class="mb-2 block text-sm font-medium text-gray-700">
							Guest Email *
						</label>
						<input
							id="guestEmail"
							name="guestEmail"
							type="email"
							bind:value={addBookingForm.guestEmail}
							placeholder="Enter guest email"
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div class="mb-4">
					<label for="guestPhone" class="mb-2 block text-sm font-medium text-gray-700">
						Guest Phone
					</label>
					<input
						id="guestPhone"
						name="guestPhone"
						type="tel"
						bind:value={addBookingForm.guestPhone}
						placeholder="Enter guest phone (optional)"
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="date" class="mb-1 block text-sm font-medium text-gray-700"> Date * </label>
						<input
							id="date"
							name="date"
							type="date"
							required
							bind:value={addBookingForm.date}
							min={new Date().toISOString().split("T")[0]}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="time" class="mb-1 block text-sm font-medium text-gray-700"> Time * </label>
						<input
							id="time"
							name="time"
							type="time"
							required
							bind:value={addBookingForm.time}
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div class="mb-4">
					<label for="status" class="mb-2 block text-sm font-medium text-gray-700"> Status </label>
					<select
						id="status"
						name="status"
						bind:value={addBookingForm.status}
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					>
						<option value="confirmed">Confirmed</option>
						<option value="pending">Pending</option>
						<option value="cancelled">Cancelled</option>
						<option value="rejected">Rejected</option>
						<option value="completed">Completed</option>
					</select>
				</div>

				<div class="mb-4">
					<label for="guestNotes" class="mb-2 block text-sm font-medium text-gray-700">
						Guest Notes
					</label>
					<textarea
						id="guestNotes"
						name="guestNotes"
						rows="2"
						bind:value={addBookingForm.guestNotes}
						placeholder="Any notes from the guest..."
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					></textarea>
				</div>

				<div class="mb-4">
					<label for="hostNotes" class="mb-2 block text-sm font-medium text-gray-700">
						Host Notes
					</label>
					<textarea
						id="hostNotes"
						name="hostNotes"
						rows="2"
						bind:value={addBookingForm.hostNotes}
						placeholder="Your private notes about this booking..."
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					></textarea>
				</div>

				<div class="flex items-center justify-end space-x-3">
					<button
						type="button"
						onclick={closeAddBookingModal}
						disabled={loading}
						class="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading}
						class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
					>
						{loading ? "Creating..." : "Create Booking"}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
