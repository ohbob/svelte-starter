<script lang="ts">
	import { format } from "date-fns";
	import { enhance } from "$app/forms";
	import { page } from "$app/stores";

	let { data } = $props();

	let loading = $state(false);
	let reason = $state(data.reason || "");

	// Derive the current booking status considering form results
	let currentBookingStatus = $derived(() => {
		// If form action was successful, the booking is now cancelled
		if ($page.form?.success) {
			return "cancelled";
		}
		// Otherwise use the original status from data
		return data.booking?.status;
	});

	// Derive whether we should show an error (but not if it's just a successful cancellation)
	let shouldShowError = $derived(() => {
		return data.error && !$page.form?.success;
	});

	// Derive whether we can show the cancellation form
	let canShowCancellationForm = $derived(() => {
		return (
			data.booking &&
			!shouldShowError() &&
			!$page.form?.success &&
			currentBookingStatus() !== "cancelled"
		);
	});

	function formatDateTime(date) {
		return format(new Date(date), "EEEE, MMMM d, yyyy 'at' h:mm a");
	}

	function formatDuration(minutes) {
		if (minutes < 60) return `${minutes} minutes`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0
			? `${hours} hour${hours > 1 ? "s" : ""} ${mins} minutes`
			: `${hours} hour${hours > 1 ? "s" : ""}`;
	}

	const handleEnhance = () => {
		loading = true;
		return async ({ result, update }) => {
			await update();
			loading = false;
		};
	};
</script>

<svelte:head>
	<title>Cancel Booking</title>
	<meta name="description" content="Cancel your booking" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12">
	<div class="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
		<div class="rounded-lg bg-white p-8 shadow-sm">
			<!-- Header -->
			<div class="mb-8 text-center">
				<h1 class="text-3xl font-bold text-gray-900">Cancel Booking</h1>
				{#if !shouldShowError() && !$page.form?.success}
					<p class="mt-2 text-gray-600">We're sorry to see you need to cancel your appointment</p>
				{/if}
			</div>

			{#if $page.form?.success}
				<!-- Success State -->
				<div class="rounded-lg border border-green-200 bg-green-50 p-6">
					<div class="flex">
						<svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							></path>
						</svg>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-green-800">Booking Cancelled Successfully</h3>
							<p class="mt-1 text-sm text-green-700">{$page.form.message}</p>
						</div>
					</div>
				</div>

				{#if data.booking}
					<!-- Show updated booking details after successful cancellation -->
					<div class="mt-6 rounded-lg border bg-gray-50 p-6">
						<h3 class="mb-4 text-lg font-medium text-gray-900">Booking Details</h3>
						<div class="space-y-3 text-sm">
							<div>
								<span class="font-medium text-gray-700">Meeting:</span>
								<span class="text-gray-900">{data.booking.meetingType.name}</span>
							</div>
							<div>
								<span class="font-medium text-gray-700">Date & Time:</span>
								<span class="text-gray-900">{formatDateTime(data.booking.startTime)}</span>
							</div>
							<div>
								<span class="font-medium text-gray-700">Duration:</span>
								<span class="text-gray-900"
									>{formatDuration(data.booking.meetingType.duration)}</span
								>
							</div>
							<div>
								<span class="font-medium text-gray-700">Guest:</span>
								<span class="text-gray-900">{data.booking.guestName}</span>
							</div>
							<div>
								<span class="font-medium text-gray-700">Status:</span>
								<span
									class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
								>
									cancelled
								</span>
							</div>
						</div>
					</div>
				{/if}

				<!-- Back to home link for success -->
				<div class="mt-6 text-center">
					<a href="/" class="text-sm text-gray-600 hover:text-gray-900"> ← Back to Home </a>
				</div>
			{:else if shouldShowError()}
				<!-- Error State -->
				<div class="rounded-lg border border-red-200 bg-red-50 p-6">
					<div class="flex">
						<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							></path>
						</svg>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-red-800">Unable to Cancel</h3>
							<p class="mt-1 text-sm text-red-700">{data.error}</p>

							{#if data.booking && data.hoursUntilBooking !== undefined}
								<p class="mt-2 text-sm text-red-600">
									Your booking is in {data.hoursUntilBooking} hours.
									{#if data.booking.meetingType.company.email}
										Please contact us at <a
											href="mailto:{data.booking.meetingType.company.email}"
											class="font-medium underline">{data.booking.meetingType.company.email}</a
										> for assistance.
									{:else}
										Please contact us directly for assistance.
									{/if}
								</p>
							{/if}
						</div>
					</div>
				</div>

				{#if data.booking}
					<!-- Show booking details for error cases -->
					<div class="mt-6 rounded-lg border bg-gray-50 p-6">
						<h3 class="mb-4 text-lg font-medium text-gray-900">Booking Details</h3>
						<div class="space-y-3 text-sm">
							<div>
								<span class="font-medium text-gray-700">Meeting:</span>
								<span class="text-gray-900">{data.booking.meetingType.name}</span>
							</div>
							<div>
								<span class="font-medium text-gray-700">Date & Time:</span>
								<span class="text-gray-900">{formatDateTime(data.booking.startTime)}</span>
							</div>
							<div>
								<span class="font-medium text-gray-700">Duration:</span>
								<span class="text-gray-900"
									>{formatDuration(data.booking.meetingType.duration)}</span
								>
							</div>
							<div>
								<span class="font-medium text-gray-700">Guest:</span>
								<span class="text-gray-900">{data.booking.guestName}</span>
							</div>
							<div>
								<span class="font-medium text-gray-700">Status:</span>
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {currentBookingStatus() ===
									'confirmed'
										? 'bg-green-100 text-green-800'
										: currentBookingStatus() === 'cancelled'
											? 'bg-red-100 text-red-800'
											: 'bg-yellow-100 text-yellow-800'}"
								>
									{currentBookingStatus()}
								</span>
							</div>
						</div>
					</div>
				{/if}

				<!-- Back to home link for error cases -->
				<div class="mt-6 text-center">
					<a href="/" class="text-sm text-gray-600 hover:text-gray-900"> ← Back to Home </a>
				</div>
			{:else if canShowCancellationForm()}
				<!-- Cancellation Form - only show if no error and not already cancelled -->
				<div class="space-y-6">
					<!-- Booking Details -->
					<div class="rounded-lg border bg-gray-50 p-6">
						<h3 class="mb-4 text-lg font-medium text-gray-900">Booking Details</h3>
						<div class="space-y-3 text-sm">
							<div>
								<span class="font-medium text-gray-700">Meeting:</span>
								<span class="text-gray-900">{data.booking.meetingType.name}</span>
							</div>
							<div>
								<span class="font-medium text-gray-700">Date & Time:</span>
								<span class="text-gray-900">{formatDateTime(data.booking.startTime)}</span>
							</div>
							<div>
								<span class="font-medium text-gray-700">Duration:</span>
								<span class="text-gray-900"
									>{formatDuration(data.booking.meetingType.duration)}</span
								>
							</div>
							<div>
								<span class="font-medium text-gray-700">Guest:</span>
								<span class="text-gray-900">{data.booking.guestName}</span>
							</div>
							<div>
								<span class="font-medium text-gray-700">Time until meeting:</span>
								<span class="text-gray-900">{data.hoursUntilBooking} hours</span>
							</div>
						</div>
					</div>

					<!-- Cancellation Form -->
					<form method="POST" action="?/cancel" use:enhance={handleEnhance} class="space-y-6">
						<div>
							<label for="reason" class="mb-2 block text-sm font-medium text-gray-700">
								Reason for Cancellation *
							</label>
							<textarea
								id="reason"
								name="reason"
								bind:value={reason}
								required
								rows="4"
								placeholder="Please let us know why you need to cancel this booking. This helps us improve our service."
								class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								class:border-red-300={$page.form?.error && $page.form?.error.includes("reason")}
							></textarea>
							<p class="mt-1 text-xs text-gray-500">Minimum 10 characters required</p>
							{#if $page.form?.error && $page.form?.error.includes("reason")}
								<p class="mt-1 text-sm text-red-600">{$page.form.error}</p>
							{/if}
						</div>

						{#if $page.form?.error && !$page.form?.error.includes("reason")}
							<div class="rounded-lg border border-red-200 bg-red-50 p-4">
								<p class="text-sm text-red-700">{$page.form.error}</p>
							</div>
						{/if}

						<div class="flex items-center justify-between pt-4">
							<a href="/" class="text-sm text-gray-600 hover:text-gray-900"> ← Back to Home </a>

							<button
								type="submit"
								disabled={loading || !reason || reason.trim().length < 10}
								class="rounded-md bg-red-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{loading ? "Cancelling..." : "Cancel Booking"}
							</button>
						</div>
					</form>

					<!-- Warning Notice -->
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
								<h3 class="text-sm font-medium text-yellow-800">Important Notice</h3>
								<p class="mt-1 text-sm text-yellow-700">
									Bookings can only be cancelled more than 24 hours in advance. For last-minute
									cancellations, please contact us directly.
								</p>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<!-- No booking found -->
				<div class="rounded-lg border border-red-200 bg-red-50 p-6">
					<div class="flex">
						<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							></path>
						</svg>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-red-800">Booking Not Found</h3>
							<p class="mt-1 text-sm text-red-700">
								The booking could not be found or the cancellation link is invalid.
							</p>
						</div>
					</div>
				</div>

				<div class="mt-6 text-center">
					<a href="/" class="text-sm text-gray-600 hover:text-gray-900"> ← Back to Home </a>
				</div>
			{/if}
		</div>
	</div>
</div>
