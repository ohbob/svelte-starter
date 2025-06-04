<script>
	import { format, addMonths, subMonths, addDays } from "date-fns";

	let { currentDate = $bindable(), currentView, onGoToToday, onDateChange } = $props();

	function prevPeriod() {
		if (currentView === "month") {
			currentDate = subMonths(currentDate, 1);
		} else if (currentView === "week") {
			currentDate = addDays(currentDate, -7);
		} else if (currentView === "day") {
			currentDate = addDays(currentDate, -1);
		}
		// Notify parent about date change
		if (onDateChange) {
			onDateChange(currentDate);
		}
	}

	function nextPeriod() {
		if (currentView === "month") {
			currentDate = addMonths(currentDate, 1);
		} else if (currentView === "week") {
			currentDate = addDays(currentDate, 7);
		} else if (currentView === "day") {
			currentDate = addDays(currentDate, 1);
		}
		// Notify parent about date change
		if (onDateChange) {
			onDateChange(currentDate);
		}
	}

	let title = $derived.by(() => {
		if (currentView === "month") {
			return format(currentDate, "MMMM yyyy");
		} else if (currentView === "day") {
			return format(currentDate, "EEEE, MMMM d, yyyy");
		}
		return format(currentDate, "MMM d, yyyy");
	});
</script>

<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
	<div class="flex items-center gap-4">
		<h3 class="text-lg font-semibold text-gray-900">
			{title}
		</h3>
		<button
			type="button"
			onclick={onGoToToday}
			class="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
		>
			Today
		</button>
	</div>

	<div class="flex items-center gap-2">
		<button
			type="button"
			onclick={prevPeriod}
			aria-label="Previous {currentView}"
			class="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		<button
			type="button"
			onclick={nextPeriod}
			aria-label="Next {currentView}"
			class="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>
	</div>
</div>
